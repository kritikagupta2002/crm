import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode';

interface InvoiceQrCodeProps {
  value: string;
  size?: number;
  darkColor?: string;
  lightColor?: string;
  quietZone?: number;
}

/**
 * Mobile-native SVG vector QR code component.
 * Reuses the existing `qrcode` library from web source,
 * converting the QR module matrix into crisp scalable native SVG vector paths.
 */
export const InvoiceQrCode: React.FC<InvoiceQrCodeProps> = ({
  value,
  size = 180,
  darkColor = '#0f2a3d',
  lightColor = '#ffffff',
  quietZone = 2,
}) => {
  const qrData = useMemo(() => {
    try {
      if (!value) return null;
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const modCount = qr.modules.size;
      const totalCount = modCount + quietZone * 2;

      let path = '';
      for (let r = 0; r < modCount; r++) {
        for (let c = 0; c < modCount; c++) {
          if (qr.modules.get(r, c)) {
            const x = c + quietZone;
            const y = r + quietZone;
            path += `M${x},${y}h1v1h-1z `;
          }
        }
      }
      return { totalCount, path };
    } catch (err) {
      console.error('InvoiceQrCode generation error:', err);
      return null;
    }
  }, [value, quietZone]);

  if (!qrData) {
    return <View style={[styles.placeholder, { width: size, height: size }]} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: lightColor }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${qrData.totalCount} ${qrData.totalCount}`}
      >
        <Path d={qrData.path} fill={darkColor} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  placeholder: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
});
