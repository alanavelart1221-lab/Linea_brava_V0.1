export function VideoEmbed({ embedUrl, title }: { embedUrl: string; title?: string }) {
  return (
    <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-ink-700">
      <iframe
        src={embedUrl}
        title={title ?? "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
