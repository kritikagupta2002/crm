import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode';
import { colors, typography, borderRadius } from '../../theme';
import { ShieldCheck } from 'lucide-react-native';

interface PayslipQrCodeProps {
  value: string;
  size?: number;
  slipId?: string;
  showVerificationBadge?: boolean;
}

export const PayslipQrCode: React.FC<PayslipQrCodeProps> = ({
  value,
  size = 72,
  slipId,
  showVerificationBadge = true,
}) => {
  const qrData = useMemo(() => {
    try {
      if (!value) return null;
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const modCount = qr.modules.size;
      const quietZone = 2;
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
      console.error('PayslipQrCode generation error:', err);
      return null;
    }
  }, [value]);

  if (!qrData) {
    return <View style={[styles.placeholder, { width: size, height: size }]} />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.qrBox, { width: size, height: size }]}>
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${qrData.totalCount} ${qrData.totalCount}`}
        >
          <Path d={qrData.path} fill="#1A2430" />
        </Svg>
      </View>

      {showVerificationBadge && (
        <View style={styles.badgeWrap}>
          <View style={styles.badgeHeader}>
            <ShieldCheck size={14} color="#0D9488" />
            <Text style={styles.badgeTitle}>Digitally Certified</Text>
          </View>
          <Text style={styles.badgeSubtitle}>Scan to verify payroll authenticity</Text>
          {slipId ? <Text style={styles.slipIdText}>ID: {slipId}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  placeholder: {
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.sm,
  },
  badgeWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  badgeTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 11,
  },
  badgeSubtitle: {
    ...typography.caption,
    fontSize: 9,
    color: '#64748B',
  },
  slipIdText: {
    ...typography.caption,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 2,
  },
});
