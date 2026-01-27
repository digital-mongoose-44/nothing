# SSE Streaming Demo

A Next.js application demonstrating Server-Sent Events (SSE) for real-time streaming of data and dynamic UI components.

## What is SSE?

Server-Sent Events (SSE) is a standard that enables servers to push real-time updates to clients over HTTP. Unlike WebSockets, SSE is:

- **Unidirectional** - Server pushes to client only
- **Simple** - Uses standard HTTP, no special protocol
- **Auto-reconnecting** - Built-in reconnection handling
- **Event-based** - Supports named events for filtering

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SSE STREAMING ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                                  ┌─────────────────────┐
│     SERVER      │                                  │       CLIENT        │
│  (API Route)    │                                  │   (React Page)      │
├─────────────────┤                                  ├─────────────────────┤
│                 │    HTTP Response                 │                     │
│  ReadableStream │    Content-Type: text/event-stream                     │
│        │        │ ─────────────────────────────────►  EventSource API   │
│        ▼        │                                  │         │           │
│   TextEncoder   │    data: {"id":"1",...}\n\n     │         ▼           │
│        │        │    data: {"id":"2",...}\n\n     │   onmessage()       │
│        ▼        │    data: {"type":"done"}\n\n    │         │           │
│  controller     │                                  │         ▼           │
│  .enqueue()     │                                  │   JSON.parse()      │
│                 │                                  │         │           │
└─────────────────┘                                  │         ▼           │
                                                     │   useState()        │
                                                     │   setStreamData()   │
                                                     │         │           │
                                                     │         ▼           │
                                                     │   renderUIItem()    │
                                                     │   switch(type)      │
                                                     │    ├─ "image" ──► Image
                                                     │    ├─ "stats" ──► Stats
                                                     │    └─ default ──► JSON
                                                     └─────────────────────┘
```

## Project Structure

```
app/
├── api/stream/
│   ├── text/route.ts       # Simple text streaming
│   ├── chat/route.ts       # Chat-style streaming (POST)
│   ├── progress/route.ts   # Progress bar updates
│   ├── ui/route.ts         # Dynamic UI component streaming
│   └── better-sse/route.ts # Using better-sse library
├── text/page.tsx           # Text streaming demo
├── chat/page.tsx           # Chat interface demo
├── progress/page.tsx       # Progress bar demo
├── ui/page.tsx             # Dynamic UI rendering demo
└── better-sse/page.tsx     # better-sse library demo
```

## Server-Side Implementation

Create an SSE endpoint using `ReadableStream`:

```typescript
// app/api/stream/ui/route.ts
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendChunk = (data: string) => {
        // SSE format: "data: {json}\n\n"
        const message = `data: ${data}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Stream data chunks
      for (const chunk of STREAM_CHUNKS) {
        sendChunk(JSON.stringify(chunk));
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Signal completion
      sendChunk(JSON.stringify({ type: "done" }));
      controller.close();
    },
  });

  // Required SSE headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Required Headers

| Header          | Value               | Purpose                         |
| --------------- | ------------------- | ------------------------------- |
| `Content-Type`  | `text/event-stream` | Identifies response as SSE      |
| `Cache-Control` | `no-cache`          | Prevents caching of stream      |
| `Connection`    | `keep-alive`        | Maintains persistent connection |

## Client-Side Implementation

Consume SSE events using the `EventSource` API:

```typescript
// app/ui/page.tsx
const handleStartStream = () => {
  const eventSource = new EventSource("/api/stream/ui");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "done") {
      eventSource.close();
      setIsStreaming(false);
    } else if (data.id && data.output !== undefined) {
      setStreamData(data as StreamData);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    setIsStreaming(false);
  };
};
```

## UI Rendering from Stream Events

The UI streaming demo shows how to progressively render components based on streamed data.

### Event Data Structure

```typescript
interface StreamData {
  id: string;
  output: string; // Text message to display
  ui: UIItem[]; // Array of UI components to render
}

interface UIItem {
  id: string;
  type: "image" | "stats" | string;
  url?: string; // For image type
  data?: object; // For stats type
}
```

### Dynamic Component Rendering

The `renderUIItem()` function uses a switch pattern to render different components based on the `type` field:

```typescript
const renderUIItem = (item: UIItem) => {
  switch (item.type) {
    case "image":
      return <Image src={item.url} ... />;
    case "stats":
      return (
        <div className="stats-card">
          {Object.entries(item.data).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      );
    default:
      // Fallback: render as JSON
      return <pre>{JSON.stringify(item, null, 2)}</pre>;
  }
};
```

### Progressive Enhancement Flow

The server sends increasingly complex UI data:

1. **Chunk 1**: Text only (`ui: []`)
2. **Chunk 2**: Text + Image component
3. **Chunk 3**: Text + Image + Stats card

Each chunk replaces the previous state, allowing the server to control exactly what components are displayed at each step.

## Available Demos

| Demo              | Path          | Description                                 |
| ----------------- | ------------- | ------------------------------------------- |
| **Text Stream**   | `/text`       | Simple word-by-word text streaming          |
| **Chat**          | `/chat`       | Chat interface with POST request streaming  |
| **Progress**      | `/progress`   | Progress bar with percentage updates        |
| **UI Components** | `/ui`         | Dynamic component rendering (images, stats) |
| **Better-SSE**    | `/better-sse` | Using the better-sse library                |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Key Concepts

1. **SSE Message Format**: Each message must be prefixed with `data: ` and end with `\n\n`
2. **JSON Serialization**: Complex data is JSON-stringified for transmission
3. **Connection Cleanup**: Always close `EventSource` when done to free resources
4. **State Management**: Use `useState` with functional updates for accumulating data
5. **Error Handling**: Handle both `onerror` events and error messages in the stream
