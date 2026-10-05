import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {githubDarkInit} from '@uiw/codemirror-theme-github';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';
import styles from './styles.module.css';

const SERVER_URL = 'https://magpie-signaling.salmongrass-bd59c21e.westeurope.azurecontainerapps.io';
const BUNDLE_URL = '/vendor/magpie-0.6.0.umd.js';
const TOPIC = 'playground/messages';
const SERVICE = 'playground/echo';
const VIDEO_TOPIC = '/video';
const AUDIO_TOPIC = '/audio';

const magpieEditorTheme = githubDarkInit({
  settings: {
    background: '#0d171b',
    foreground: '#dce8e5',
    caret: '#68e4c4',
    selection: '#24584f',
    selectionMatch: '#294b57',
    lineHighlight: '#15272c',
    gutterBackground: '#0a1418',
    gutterForeground: '#708681',
    gutterActiveForeground: '#c7d8d4',
    gutterBorder: 'rgba(190, 224, 216, 0.10)',
    fontFamily: "'DM Mono', 'SFMono-Regular', Consolas, monospace",
    fontSize: '14px',
  },
  styles: [
    {tag: t.comment, color: '#829893', fontStyle: 'italic'},
    {tag: [t.keyword, t.controlKeyword, t.modifier], color: '#ff938b'},
    {tag: [t.variableName, t.definition(t.variableName)], color: '#dce8e5'},
    {tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#65e2c2'},
    {tag: [t.propertyName, t.attributeName], color: '#bfa8ff'},
    {tag: [t.string, t.special(t.string), t.regexp], color: '#b7e7a8'},
    {tag: [t.number, t.bool, t.atom], color: '#ffc47d'},
    {tag: [t.operator, t.logicOperator, t.compareOperator], color: '#aebfff'},
    {tag: [t.typeName, t.className], color: '#f1a7d4'},
    {tag: [t.bracket, t.punctuation, t.separator], color: '#a8bbb7'},
    {tag: t.null, color: '#ffbf78'},
    {tag: t.invalid, color: '#fff0ef', backgroundColor: '#8a3434'},
  ],
});

type ExampleId =
  | 'stream-writer'
  | 'stream-reader'
  | 'rpc-requester'
  | 'rpc-responder'
  | 'video-viewer'
  | 'video-capture'
  | 'audio-player'
  | 'audio-capture';
type Status = 'idle' | 'loading' | 'waiting' | 'connected' | 'stopping' | 'error';
type LogLevel = 'info' | 'success' | 'warning' | 'error';
type CliPlatform = 'unix' | 'powershell';

type LogEntry = {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
};

type Runtime = {
  abortController: AbortController;
  resources: unknown[];
};

type Example = {
  id: ExampleId;
  label: string;
  shortLabel: string;
  description: string;
  filename: string;
  peer: ExampleId;
  code: string;
  media?: 'video' | 'audio';
  mediaDirection?: 'receive' | 'send';
};

declare global {
  interface Window {
    Magpie?: Record<string, any>;
    __magpieBundlePromise?: Promise<Record<string, any>>;
  }
}

const connectPrelude = `const serverUrl =
  '${SERVER_URL}';

log('Requesting short-lived ICE credentials…');
const iceResponse = await fetch(
  \`\${serverUrl}/ice/\${encodeURIComponent(sessionId)}\`,
  {signal},
);
if (!iceResponse.ok) {
  throw new Error(\`ICE configuration request failed (\${iceResponse.status}).\`);
}
const ice = await iceResponse.json();
log(\`ICE ready · \${forceTurn ? 'TURN relay required' : 'direct path preferred, TURN available'}\`);

const connection = track(await Magpie.WebRtcConnection.withHttp(
  \`\${serverUrl}/signal\`,
  sessionId,
  {
    role: ROLE,
    reconnect: true,
    webrtcOptions: {
      stunServers: ice.stunServers,
      turnServers: ice.turnServers,
      iceTransportPolicy: forceTurn ? 'relay' : 'all',
    },
  },
));

setStatus('waiting');
log(\`Waiting for a peer in session "\${sessionId}"…\`);
if (!await connection.connect(60)) {
  throw new Error('No peer connected within 60 seconds.');
}
setStatus('connected');
log(\`Connected to \${connection.peerIds.length} peer(s).\`, 'success');`;

function mediaConnectionPrelude(kind: 'video' | 'audio', role: 'host' | 'client'): string {
  const topic = kind === 'video' ? VIDEO_TOPIC : AUDIO_TOPIC;
  const topicOption = kind === 'video' ? 'videoTopics' : 'audioTopics';
  return `const serverUrl =
  '${SERVER_URL}';

log('Requesting short-lived ICE credentials…');
const iceResponse = await fetch(
  \`\${serverUrl}/ice/\${encodeURIComponent(sessionId)}\`,
  {signal},
);
if (!iceResponse.ok) {
  throw new Error(\`ICE configuration request failed (\${iceResponse.status}).\`);
}
const ice = await iceResponse.json();

const connection = track(await Magpie.WebRtcConnection.withHttp(
  \`\${serverUrl}/signal\`,
  sessionId,
  {
    role: '${role}',
    reconnect: true,
    webrtcOptions: {
      stunServers: ice.stunServers,
      turnServers: ice.turnServers,
      iceTransportPolicy: forceTurn ? 'relay' : 'all',
      ${topicOption}: ['${topic}'],
    },
  },
));`;
}

const waitForMediaPeer = `setStatus('waiting');
log(\`Waiting for a peer in session "\${sessionId}"…\`);
if (!await connection.connect(60)) {
  throw new Error('No peer connected within 60 seconds.');
}
setStatus('connected');
log('WebRTC peer connected.', 'success');`;

const examples: Record<ExampleId, Example> = {
  'stream-writer': {
    id: 'stream-writer',
    label: 'Stream · Publisher',
    shortLabel: 'publisher',
    description: 'Publish a structured value once per second over a MAGPIE WebRTC stream.',
    filename: 'browser_writer.js',
    peer: 'stream-reader',
    code: `${connectPrelude.replace('ROLE', "'host'")}

const writer = track(new Magpie.WebRtcStreamWriter(connection));
let sequence = 0;

while (!signal.aborted) {
  const value = {
    sequence: ++sequence,
    message: 'Hello from MAGPIE in the browser',
  };
  await writer.write(value, '${TOPIC}');
  log(\`Published #\${sequence} to ${TOPIC}\`);
  await sleep(1000);
}`,
  },
  'stream-reader': {
    id: 'stream-reader',
    label: 'Stream · Subscriber',
    shortLabel: 'subscriber',
    description: 'Subscribe to a topic and inspect structured values arriving from another node.',
    filename: 'browser_reader.js',
    peer: 'stream-writer',
    code: `${connectPrelude.replace('ROLE', "'client'")}

const reader = track(new Magpie.WebRtcStreamReader(connection, '${TOPIC}'));

while (!signal.aborted) {
  try {
    const [value, topic] = await reader.read(2);
    log(\`\${topic}  \${JSON.stringify(value)}\`, 'success');
  } catch (error) {
    if (signal.aborted) break;
    if (error.name !== 'TimeoutError') throw error;
  }
}`,
  },
  'rpc-requester': {
    id: 'rpc-requester',
    label: 'RPC · Requester',
    shortLabel: 'requester',
    description: 'Call a remote MAGPIE service and receive its typed response.',
    filename: 'browser_requester.js',
    peer: 'rpc-responder',
    code: `${connectPrelude.replace('ROLE', "'client'")}

const requester = track(
  new Magpie.WebRtcRpcRequester(connection, '${SERVICE}'),
);
let requestId = 0;

while (!signal.aborted) {
  const request = {id: ++requestId, action: 'echo', value: 42};
  log(\`Request  →  \${JSON.stringify(request)}\`);
  const response = await requester.call(request, 5);
  log(\`Response ←  \${JSON.stringify(response)}\`, 'success');
  await sleep(2000);
}`,
  },
  'rpc-responder': {
    id: 'rpc-responder',
    label: 'RPC · Responder',
    shortLabel: 'responder',
    description: 'Expose a small service that acknowledges requests and returns a response.',
    filename: 'browser_responder.js',
    peer: 'rpc-requester',
    code: `${connectPrelude.replace('ROLE', "'host'")}

const responder = track(
  new Magpie.WebRtcRpcResponder(connection, '${SERVICE}'),
);

responder.onRequest((request) => {
  log(\`Request received: \${JSON.stringify(request)}\`);
  return {
    status: 'ok',
    echoed: request,
    handledAt: new Date().toISOString(),
  };
});

log('Echo service is ready.', 'success');
await waitUntilStopped();`,
  },
  'video-viewer': {
    id: 'video-viewer',
    label: 'Video · Browser viewer',
    shortLabel: 'video in',
    description: 'Receive a camera stream from Python and display it directly in the browser.',
    filename: 'browser_video_viewer.js',
    peer: 'video-capture',
    media: 'video',
    mediaDirection: 'receive',
    code: `${mediaConnectionPrelude('video', 'client')}

const incomingTrack = connection.receiveVideoTrack('${VIDEO_TOPIC}');

${waitForMediaPeer}

log('Waiting for video on ${VIDEO_TOPIC}…');
const videoTrack = await incomingTrack;
const stream = track(new MediaStream([videoTrack]));
video.srcObject = stream;
await video.play();
setMediaActive(true);
log('Receiving video on ${VIDEO_TOPIC}.', 'success');

await waitUntilStopped();`,
  },
  'video-capture': {
    id: 'video-capture',
    label: 'Video · Browser capture',
    shortLabel: 'video out',
    description: 'Capture this browser’s camera and stream it to a Python or browser viewer.',
    filename: 'browser_video_capture.js',
    peer: 'video-viewer',
    media: 'video',
    mediaDirection: 'send',
    code: `${mediaConnectionPrelude('video', 'host')}

log('Requesting camera access…');
const stream = track(await navigator.mediaDevices.getUserMedia({video: true}));
const videoTrack = stream.getVideoTracks()[0];
video.srcObject = stream;
video.muted = true;
await video.play();
setMediaActive(true);
connection.sendVideoTrack(videoTrack, '${VIDEO_TOPIC}');
log('Camera ready on ${VIDEO_TOPIC}.', 'success');

${waitForMediaPeer}
await waitUntilStopped();`,
  },
  'audio-player': {
    id: 'audio-player',
    label: 'Audio · Browser player',
    shortLabel: 'audio in',
    description: 'Receive a microphone stream from Python and play it in the browser.',
    filename: 'browser_audio_player.js',
    peer: 'audio-capture',
    media: 'audio',
    mediaDirection: 'receive',
    code: `${mediaConnectionPrelude('audio', 'client')}

const incomingTrack = connection.receiveAudioTrack('${AUDIO_TOPIC}');

${waitForMediaPeer}

log('Waiting for audio on ${AUDIO_TOPIC}…');
const audioTrack = await incomingTrack;
const stream = track(new MediaStream([audioTrack]));
audio.srcObject = stream;
try {
  await audio.play();
} catch {
  log('Audio received. Click the audio panel if the browser blocked autoplay.', 'warning');
}
setMediaActive(true);
log('Playing audio from ${AUDIO_TOPIC}.', 'success');

await waitUntilStopped();`,
  },
  'audio-capture': {
    id: 'audio-capture',
    label: 'Audio · Browser capture',
    shortLabel: 'audio out',
    description: 'Capture this browser’s microphone and stream it to a Python or browser player.',
    filename: 'browser_audio_capture.js',
    peer: 'audio-player',
    media: 'audio',
    mediaDirection: 'send',
    code: `${mediaConnectionPrelude('audio', 'host')}

log('Requesting microphone access…');
const stream = track(await navigator.mediaDevices.getUserMedia({audio: true}));
const audioTrack = stream.getAudioTracks()[0];
connection.sendAudioTrack(audioTrack, '${AUDIO_TOPIC}');
setMediaActive(true);
log('Microphone streaming on ${AUDIO_TOPIC}.', 'success');

${waitForMediaPeer}
await waitUntilStopped();`,
  },
};

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function createSessionId(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return `magpie-${random}`;
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

async function loadMagpie(): Promise<Record<string, any>> {
  if (window.Magpie) return window.Magpie;
  if (window.__magpieBundlePromise) return window.__magpieBundlePromise;

  window.__magpieBundlePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${BUNDLE_URL}"]`);
    const script = existing ?? document.createElement('script');
    const onLoad = () => window.Magpie
      ? resolve(window.Magpie)
      : reject(new Error('MAGPIE loaded without exposing its browser API.'));
    const onError = () => reject(new Error('Could not load the MAGPIE browser bundle.'));

    script.addEventListener('load', onLoad, {once: true});
    script.addEventListener('error', onError, {once: true});
    if (!existing) {
      script.src = BUNDLE_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  });

  return window.__magpieBundlePromise;
}

function isExampleId(value: string | null): value is ExampleId {
  return value !== null && value in examples;
}

export default function Playground(): React.ReactElement {
  const initial = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedExample = params.get('example');
    return {
      example: isExampleId(requestedExample) ? requestedExample : 'stream-writer' as ExampleId,
      session: params.get('session')?.trim() || createSessionId(),
    };
  }, []);

  const [exampleId, setExampleId] = useState<ExampleId>(initial.example);
  const [code, setCode] = useState(examples[initial.example].code);
  const [sessionId, setSessionId] = useState(initial.session);
  const [forceTurn, setForceTurn] = useState(false);
  const [cliPlatform, setCliPlatform] = useState<CliPlatform>('unix');
  const [mediaActive, setMediaActive] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState<'session' | 'link' | 'command' | null>(null);
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const logIdRef = useRef(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  const pythonPanelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const example = examples[exampleId];
  const running = !['idle', 'error'].includes(status);
  const hasMedia = example.media !== undefined;

  const appendLog = useCallback((message: unknown, level: LogLevel = 'info') => {
    const rendered = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    setLogs((current) => [
      ...current.slice(-199),
      {id: ++logIdRef.current, timestamp: timestamp(), level, message: rendered},
    ]);
  }, []);

  useEffect(() => {
    consoleRef.current?.scrollTo({top: consoleRef.current.scrollHeight});
  }, [logs]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${SERVER_URL}/healthz`, {signal: controller.signal})
      .then((response) => setServiceOnline(response.ok))
      .catch(() => setServiceOnline(false));
    return () => controller.abort();
  }, []);

  const stop = useCallback(async (quiet = false) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      setStatus('idle');
      return;
    }

    runtimeRef.current = null;
    setStatus('stopping');
    runtime.abortController.abort();
    for (const resource of [...runtime.resources].reverse()) {
      try {
        const candidate = resource as {close?: () => unknown; disconnect?: () => unknown};
        const mediaResource = resource as {getTracks?: () => MediaStreamTrack[]};
        if (typeof mediaResource.getTracks === 'function') {
          mediaResource.getTracks().forEach((track) => track.stop());
        } else if (typeof candidate.close === 'function') await candidate.close();
        else if (typeof candidate.disconnect === 'function') await candidate.disconnect();
      } catch {
        // Cleanup should continue even if one resource has already closed.
      }
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    setMediaActive(false);
    setStatus('idle');
    if (!quiet) appendLog('Stopped and released playground resources.', 'warning');
  }, [appendLog]);

  useEffect(() => () => { void stop(true); }, [stop]);

  const run = useCallback(async () => {
    if (running) return;
    if (!/^[A-Za-z0-9][A-Za-z0-9._~-]{2,127}$/.test(sessionId)) {
      appendLog('Use 3–128 letters, numbers, dots, underscores, tildes, or hyphens for the session ID.', 'error');
      setStatus('error');
      return;
    }

    setLogs([]);
    setStatus('loading');
    appendLog('Loading the MAGPIE browser runtime…');

    const abortController = new AbortController();
    const runtime: Runtime = {abortController, resources: []};
    runtimeRef.current = runtime;

    const sleep = (milliseconds: number) => new Promise<void>((resolve) => {
      if (abortController.signal.aborted) return resolve();
      const timer = window.setTimeout(resolve, milliseconds);
      abortController.signal.addEventListener('abort', () => {
        window.clearTimeout(timer);
        resolve();
      }, {once: true});
    });

    const waitUntilStopped = () => new Promise<void>((resolve) => {
      if (abortController.signal.aborted) resolve();
      else abortController.signal.addEventListener('abort', () => resolve(), {once: true});
    });

    try {
      const Magpie = await loadMagpie();
      if (runtimeRef.current !== runtime) return;

      const context = {
        sessionId,
        forceTurn,
        signal: abortController.signal,
        sleep,
        waitUntilStopped,
        log: appendLog,
        setStatus,
        setMediaActive,
        video: videoRef.current,
        audio: audioRef.current,
        track: <T,>(resource: T): T => {
          runtime.resources.push(resource);
          return resource;
        },
      };

      const execute = new AsyncFunction(
        'Magpie',
        'context',
        `"use strict";\nconst {sessionId, forceTurn, signal, sleep, waitUntilStopped, log, setStatus, setMediaActive, video, audio, track} = context;\n${code}`,
      );
      await execute(Magpie, context);
      if (!abortController.signal.aborted && runtimeRef.current === runtime) {
        appendLog('Example completed.', 'success');
      }
    } catch (error) {
      if (abortController.signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      await stop(true);
      appendLog(message, 'error');
      setStatus('error');
    }
  }, [appendLog, code, forceTurn, running, sessionId, stop]);

  const selectExample = useCallback((next: ExampleId) => {
    if (running) void stop(true);
    setExampleId(next);
    setCode(examples[next].code);
    setLogs([]);
    setMediaActive(false);
    setStatus('idle');
  }, [running, stop]);

  const resetCode = useCallback(() => {
    setCode(example.code);
    appendLog('Starter code restored.', 'warning');
  }, [appendLog, example.code]);

  const copyText = useCallback(async (value: string, type: 'session' | 'link' | 'command') => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1400);
  }, []);

  const peerUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('example', example.peer);
    url.searchParams.set('session', sessionId);
    return url.toString();
  }, [example.peer, sessionId]);

  const pythonCommand = useMemo(() => {
    const unixIceShape = forceTurn
      ? '{stun_servers:.stunServers,turn_servers:.turnServers,ice_transport_policy:"relay"}'
      : '{stun_servers:.stunServers,turn_servers:.turnServers}';
    const powershellIceShape = forceTurn
      ? '@{stun_servers=$i.stunServers; turn_servers=$i.turnServers; ice_transport_policy="relay"}'
      : '@{stun_servers=$i.stunServers; turn_servers=$i.turnServers}';
    const unixSetup = `SERVER="${SERVER_URL}"
SESSION="${sessionId}"
ICE=$(curl -fsS "$SERVER/ice/$SESSION" | jq -c '${unixIceShape}')`;
    const powershellSetup = `$Server = "${SERVER_URL}"
$Session = "${sessionId}"
$i = Invoke-RestMethod "$Server/ice/$Session"
$ice = ${powershellIceShape} | ConvertTo-Json -Compress -Depth 5
$IceFile = Join-Path $PWD 'ice-options.json'
[IO.File]::WriteAllText($IceFile, $ice)`;

    const commands: Partial<Record<ExampleId, {unix: string; powershell: string; tool: string}>> = {
      'stream-writer': {
        tool: 'magpie-read-webrtc',
        unix: `magpie-read-webrtc "$SESSION" ${TOPIC} \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-read-webrtc.exe $Session ${TOPIC} \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'stream-reader': {
        tool: 'magpie-write-webrtc',
        unix: `magpie-write-webrtc "$SESSION" ${TOPIC} '{"message":"Hello from Python"}' \\
  --rate 1 --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-write-webrtc.exe $Session ${TOPIC} '{"message":"Hello from Python"}' \`
  --rate 1 --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'rpc-responder': {
        tool: 'magpie-request-webrtc',
        unix: `magpie-request-webrtc "$SESSION" ${SERVICE} '{"action":"echo","value":42}' \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-request-webrtc.exe $Session ${SERVICE} '{"action":"echo","value":42}' \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'video-viewer': {
        tool: 'magpie-video-capture-webrtc',
        unix: `magpie-video-capture-webrtc "$SESSION" ${VIDEO_TOPIC} \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-video-capture-webrtc.exe $Session ${VIDEO_TOPIC} \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'video-capture': {
        tool: 'magpie-video-viewer-webrtc',
        unix: `magpie-video-viewer-webrtc "$SESSION" ${VIDEO_TOPIC} \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-video-viewer-webrtc.exe $Session ${VIDEO_TOPIC} \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'audio-player': {
        tool: 'magpie-audio-capture-webrtc',
        unix: `magpie-audio-capture-webrtc "$SESSION" ${AUDIO_TOPIC} \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-audio-capture-webrtc.exe $Session ${AUDIO_TOPIC} \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
      'audio-capture': {
        tool: 'magpie-audio-player-webrtc',
        unix: `magpie-audio-player-webrtc "$SESSION" ${AUDIO_TOPIC} \\
  --signaling "$SERVER/signal" --webrtc-options "$ICE"`,
        powershell: `magpie-audio-player-webrtc.exe $Session ${AUDIO_TOPIC} \`
  --signaling "$Server/signal" --webrtc-options "@$IceFile"`,
      },
    };

    const command = commands[exampleId];
    if (!command) return null;
    return {
      tool: command.tool,
      unix: `${unixSetup}\n\n${command.unix}`,
      powershell: `${powershellSetup}\n\n${command.powershell}`,
    };
  }, [exampleId, forceTurn, sessionId]);

  const revealPythonCommand = useCallback(() => {
    pythonPanelRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <div className={styles.brandBlock}>
          <div className={styles.windowDots} aria-hidden="true"><i /><i /><i /></div>
          <div>
            <strong>MAGPIE Playground</strong>
            <span>WebRTC · live infrastructure</span>
          </div>
        </div>
        <div className={styles.serviceStatus}>
          <i className={serviceOnline ? styles.online : serviceOnline === false ? styles.offline : ''} />
          {serviceOnline === null ? 'Checking service' : serviceOnline ? 'Service online' : 'Service unavailable'}
        </div>
      </div>

      <div className={styles.setupBar}>
        <label className={styles.field}>
          <span>Example</span>
          <select
            value={exampleId}
            disabled={running}
            onChange={(event) => selectExample(event.target.value as ExampleId)}>
            {Object.values(examples).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>

        <label className={styles.fieldGrow}>
          <span>Session ID</span>
          <div className={styles.sessionControl}>
            <input
              value={sessionId}
              disabled={running}
              spellCheck={false}
              onChange={(event) => setSessionId(event.target.value)}
            />
            <button type="button" disabled={running} onClick={() => setSessionId(createSessionId())} title="New session ID">
              ↻
            </button>
            <button type="button" onClick={() => void copyText(sessionId, 'session')}>
              {copied === 'session' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={forceTurn}
            disabled={running}
            onChange={(event) => setForceTurn(event.target.checked)}
          />
          <span aria-hidden="true" />
          Force TURN relay
        </label>
      </div>

      <div className={styles.exampleSummary}>
        <div>
          <span className={styles.exampleKind}>{example.shortLabel}</span>
          <p>{example.description}</p>
        </div>
        <div className={styles.summaryActions}>
          <a href={peerUrl} target="_blank" rel="noreferrer" className={styles.peerButton}>
            Open matching peer ↗
          </a>
          {pythonCommand && (
            <button type="button" className={styles.pythonButton} onClick={revealPythonCommand}>
              Python CLI ↓
            </button>
          )}
          <button type="button" onClick={() => void copyText(peerUrl, 'link')}>
            {copied === 'link' ? 'Link copied' : 'Copy peer link'}
          </button>
        </div>
      </div>

      <div className={`${styles.workbench} ${hasMedia ? styles.mediaWorkbench : ''}`}>
        <section className={styles.editorPane} aria-label="Code editor">
          <div className={styles.paneHeader}>
            <div className={styles.fileName}><i />{example.filename}</div>
            <div className={styles.editorActions}>
              <button type="button" onClick={resetCode} disabled={running}>Reset</button>
              {running ? (
                <button type="button" className={styles.stopButton} onClick={() => void stop()}>■ Stop</button>
              ) : (
                <button type="button" className={styles.runButton} onClick={() => void run()}>▶ Run node</button>
              )}
            </div>
          </div>
          <CodeMirror
            value={code}
            height="520px"
            theme={magpieEditorTheme}
            extensions={[
              javascript({jsx: false, typescript: false}),
              EditorView.lineWrapping,
            ]}
            onChange={setCode}
            editable={!running}
            basicSetup={{
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              highlightSelectionMatches: true,
              searchKeymap: true,
            }}
          />
          <div className={styles.editorFooter}>
            <span>JavaScript</span>
            <span>MAGPIE 0.6.0</span>
            <span>Editable</span>
          </div>
        </section>

        <section
          className={`${styles.outputPane} ${hasMedia ? styles.mediaOutputPane : ''}`}
          aria-label="Live output">
          <div className={styles.paneHeader}>
            <div className={styles.outputTitle}>Live output</div>
            <div className={styles.status} data-status={status}>
              <i />{status === 'idle' ? 'Ready' : status === 'loading' ? 'Starting' : status === 'waiting'
                ? 'Waiting for peer' : status === 'connected' ? 'Connected' : status === 'stopping'
                  ? 'Stopping' : 'Error'}
            </div>
          </div>
          {example.media === 'video' && (
            <div className={styles.videoStage} data-active={mediaActive}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={example.mediaDirection === 'send'}
              />
              {!mediaActive && <div className={styles.videoIdle} aria-hidden="true"><span>▶</span></div>}
            </div>
          )}
          {example.media === 'audio' && (
            <div
              className={styles.audioStage}
              data-active={mediaActive}
              onClick={() => void audioRef.current?.play()}
              title="Click to allow audio playback if your browser blocks autoplay">
              <audio ref={audioRef} autoPlay />
              <div className={styles.audioOrb} aria-hidden="true">
                <span /><span /><span /><span /><span /><span /><span />
              </div>
            </div>
          )}
          <div className={styles.console} ref={consoleRef}>
            {logs.length === 0 ? (
              <div className={styles.emptyConsole}>
                <div className={styles.consoleMark}>›_</div>
                <strong>Ready when you are.</strong>
                <span>Open the matching peer, then run this node.</span>
              </div>
            ) : logs.map((entry) => (
              <div className={styles.logEntry} data-level={entry.level} key={entry.id}>
                <span>{entry.timestamp}</span>
                <i />
                <code>{entry.message}</code>
              </div>
            ))}
          </div>
          <div className={styles.outputFooter}>
            <span>{logs.length} event{logs.length === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => setLogs([])}>Clear output</button>
          </div>
        </section>
      </div>

      {pythonCommand ? (
        <div className={styles.pythonPanel} ref={pythonPanelRef}>
          <div className={styles.pythonPanelHeader}>
            <div className={styles.pythonHeading}>
              <div className={styles.tryIcon}>⌁</div>
              <div>
                <span>CONNECT A SECOND DEVICE</span>
                <strong>Run the matching Python CLI</strong>
                <p>
                  Uses <code>{pythonCommand.tool}</code> with this session and short-lived TURN credentials.
                </p>
              </div>
            </div>
            <div className={styles.platformTabs} role="tablist" aria-label="Command platform">
              <button
                type="button"
                role="tab"
                aria-selected={cliPlatform === 'unix'}
                className={cliPlatform === 'unix' ? styles.platformTabActive : ''}
                onClick={() => setCliPlatform('unix')}>
                Linux / macOS
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={cliPlatform === 'powershell'}
                className={cliPlatform === 'powershell' ? styles.platformTabActive : ''}
                onClick={() => setCliPlatform('powershell')}>
                Windows PowerShell
              </button>
            </div>
          </div>
          <div className={styles.commandBlock}>
            <div className={styles.commandBar}>
              <span>{cliPlatform === 'unix' ? 'Terminal' : 'PowerShell'}</span>
              <button
                type="button"
                onClick={() => void copyText(pythonCommand[cliPlatform], 'command')}>
                {copied === 'command' ? '✓ Copied' : 'Copy command'}
              </button>
            </div>
            <pre><code>{pythonCommand[cliPlatform]}</code></pre>
          </div>
          <p className={styles.pythonNote}>
            Requires MAGPIE with WebRTC support. Run this command on the second device while the browser node is active.
          </p>
        </div>
      ) : (
        <div className={styles.tryBar}>
          <div className={styles.tryIcon}>⇄</div>
          <div>
            <strong>Open the matching browser peer</strong>
            <p>This example does not yet have an equivalent standard Python responder CLI.</p>
          </div>
        </div>
      )}
    </div>
  );
}
