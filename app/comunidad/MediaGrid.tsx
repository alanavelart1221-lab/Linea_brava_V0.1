type Props = {
  imageUrls: string[];
  compact?: boolean;
};

export function MediaGrid({ imageUrls, compact = false }: Props) {
  if (imageUrls.length === 0) return null;

  if (imageUrls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrls[0]}
        alt="Imagen de la publicación"
        className={`mt-3 w-full rounded-xl object-cover ${compact ? "max-h-72" : "max-h-[480px]"}`}
      />
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {imageUrls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={`Imagen ${i + 1} de la publicación`}
          className="aspect-video w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}
