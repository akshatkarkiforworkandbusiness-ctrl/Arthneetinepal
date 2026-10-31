import { useState } from 'react';

type PhotoProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * `<img>` that degrades gracefully.
 *
 * A missing or misspelled asset normally leaves a broken-image icon sitting on
 * top of the layout. Here we hide the element instead, so a bad path costs you
 * a missing photo rather than a visibly broken page.
 */
export function Photo({ src, alt, className, ...rest }: PhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
