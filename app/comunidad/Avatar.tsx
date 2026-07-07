type Props = {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
};

export function Avatar({ name, avatarUrl, size = "md" }: Props) {
  const cls = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${cls} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800 font-semibold text-trail-400`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
