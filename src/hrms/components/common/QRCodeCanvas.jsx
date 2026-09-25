import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Reusable QR Code Canvas component powered by qrcode
 */
export const QRCodeCanvas = ({
  value,
  size = 128,
  className = '',
  includeMargin = true,
  darkColor = '#0f2a3d',
  lightColor = '#ffffff',
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      String(value),
      {
        width: size,
        margin: includeMargin ? 2 : 0,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      },
      (error) => {
        if (error) {
          console.error('Error rendering QR code:', error);
        }
      }
    );
  }, [value, size, includeMargin, darkColor, lightColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`qr-code-canvas ${className}`}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: '6px' }}
    />
  );
};
