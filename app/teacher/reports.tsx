import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { theme } from '@/constants/theme';

const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => {
  const [widthAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
      delay: 100,
    }).start();
  }, [percentage]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { backgroundColor: color, width }
          ]} 
        />
      </View>
    </View>
  );
};

const StatCard = ({ emoji, label, count, percentage, color, delay }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
        delay,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.statCard,
        theme.shadows.md,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statNumbers}>
          <Text style={[styles.statCount, { color }]}>{count}</Text>
          <Text style={styles.statPercentage}>({percentage}%)</Text>
        </View>
        <ProgressBar percentage={percentage} color={color} />
      </View>
    </Animated.View>
  );
};

const CircularProgress = ({ percentage, color, label }: any) => {
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: true,
      delay: 200,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.circularContainer}>
      <View style={styles.circularBg}>
        <View style={[styles.circularFill, { backgroundColor: color }]}>
          <Text style={styles.circularPercentage}>{percentage}%</Text>
        </View>
      </View>
      <Text style={styles.circularLabel}>{label}</Text>
    </View>
  );
};

export default function ReportsScreen() {
  const { userData } = useAuth();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login' as any);
  };
  const [summary, setSummary] = useState({ happy: 0, little: 0, none: 0, total: 0 });
  const [headerAnim] = useState(new Animated.Value(0));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      if (!userData) return;
      const all = await getAllMealTracking();
      let counts = { happy: 0, little: 0, none: 0, total: 0 } as any;
      Object.entries(all).forEach(([date, data]: any) => {
        if (!date.startsWith(selectedMonth)) return;
        Object.values(data.students || {}).forEach((s: any) => {
          counts.total++;
          if (s.mealReaction === 'happy') counts.happy++;
          else if (s.mealReaction === 'little') counts.little++;
          else if (s.mealReaction === 'none') counts.none++;
        });
      });
      setSummary(counts);
    })();
  }, [userData, selectedMonth]);

  const percent = (n: number) => (summary.total ? Math.round((n / summary.total) * 100) : 0);

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const satisfactionRate = percent(summary.happy);
  const getSatisfactionStatus = () => {
    if (satisfactionRate >= 80) return { text: 'Excellent', emoji: '🌟', color: theme.colors.success };
    if (satisfactionRate >= 60) return { text: 'Good', emoji: '👍', color: theme.colors.primary };
    if (satisfactionRate >= 40) return { text: 'Fair', emoji: '😊', color: theme.colors.secondary };
    return { text: 'Needs Attention', emoji: '📊', color: theme.colors.warning };
  };

  const status = getSatisfactionStatus();

  const buildMonthData = (month: string) => {
    const rows: Array<{ date: string; happy: number; little: number; none: number; total: number }> = [];
    const all = (async () => await getAllMealTracking()) as unknown as Record<string, any>;
    // we'll rebuild from the existing `summary` but also list per-date counts
    return rows;
  };

  const generateHTML = (title: string, rows: Array<any>, totals: any) => {
    const rowsHtml = rows.map((r: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${r.date}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.happy}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.little}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.none}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.total}</td>
      </tr>
    `).join('\n');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>body{font-family: Arial, Helvetica, sans-serif; padding:20px;} table{border-collapse:collapse;width:100%;}</style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Total records: ${totals.total}</p>
          <p>Enjoyed: ${totals.happy} (${totals.happyPct}%)</p>
          <p>Ate a little: ${totals.little} (${totals.littlePct}%)</p>
          <p>Didn't eat: ${totals.none} (${totals.nonePct}%)</p>
          <table>
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Date</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center">Happy</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center">Little</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center">None</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const generateAndSharePDF = async (title: string, rows: Array<any>, totals: any) => {
    try {
      const html = generateHTML(title, rows, totals);
      // require at runtime (guarded) so TypeScript doesn't need type declarations
      let Print: any = null;
      let Sharing: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Print = require('expo-print');
      } catch (err) {
        console.warn('expo-print not installed');
      }
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Sharing = require('expo-sharing');
      } catch (err) {
        console.warn('expo-sharing not installed');
      }

      if (!Print) throw new Error('expo-print is not available');
      const { uri } = await Print.printToFileAsync({ html });
      if (!Sharing) {
        alert('Sharing is not available on this device. PDF saved to: ' + uri);
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: title });
      } else {
        alert('Sharing is not available on this device. PDF saved to: ' + uri);
      }
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Could not generate PDF: ' + (err as any).message);
    }
  };

  const onGenerateMonthlyPDF = async () => {
    const all = await getAllMealTracking();
    const rows: any[] = [];
    let counts = { happy: 0, little: 0, none: 0, total: 0 } as any;
    Object.entries(all).forEach(([date, data]: any) => {
      if (!date.startsWith(selectedMonth)) return;
      let r = { date, happy: 0, little: 0, none: 0, total: 0 };
      Object.values(data.students || {}).forEach((s: any) => {
        r.total++;
        counts.total++;
        if (s.mealReaction === 'happy') { r.happy++; counts.happy++; }
        else if (s.mealReaction === 'little') { r.little++; counts.little++; }
        else if (s.mealReaction === 'none') { r.none++; counts.none++; }
      });
      rows.push(r);
    });
    const totals = {
      ...counts,
      happyPct: counts.total ? Math.round((counts.happy / counts.total) * 100) : 0,
      littlePct: counts.total ? Math.round((counts.little / counts.total) * 100) : 0,
      nonePct: counts.total ? Math.round((counts.none / counts.total) * 100) : 0,
    };
    await generateAndSharePDF(`Meal Report - ${monthName}`, rows, totals);
  };

  const onGenerateWeeklyPDF = async () => {
    const all = await getAllMealTracking();
    const rows: any[] = [];
    let counts = { happy: 0, little: 0, none: 0, total: 0 } as any;
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    dates.forEach((date) => {
      const data = all[date];
      let r = { date, happy: 0, little: 0, none: 0, total: 0 };
      if (data) {
        Object.values(data.students || {}).forEach((s: any) => {
          r.total++;
          counts.total++;
          if (s.mealReaction === 'happy') { r.happy++; counts.happy++; }
          else if (s.mealReaction === 'little') { r.little++; counts.little++; }
          else if (s.mealReaction === 'none') { r.none++; counts.none++; }
        });
      }
      rows.push(r);
    });

    const totals = {
      ...counts,
      happyPct: counts.total ? Math.round((counts.happy / counts.total) * 100) : 0,
      littlePct: counts.total ? Math.round((counts.little / counts.total) * 100) : 0,
      nonePct: counts.total ? Math.round((counts.none / counts.total) * 100) : 0,
    };
    await generateAndSharePDF(`Meal Report - Last 7 days`, rows, totals);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.header,
          theme.shadows.sm,
          {
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
            opacity: headerAnim,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.title}>📊 Meal Reports</Text>
            <Text style={styles.subtitle}>{monthName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6 }}>
            <Text style={{ color: theme.colors.primary, fontFamily: 'Inter-SemiBold' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <TouchableOpacity onPress={onGenerateMonthlyPDF} style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: theme.borderRadius.md }}>
            <Text style={{ color: theme.colors.surface, fontFamily: 'Inter-SemiBold' }}>Download Monthly PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onGenerateWeeklyPDF} style={{ backgroundColor: theme.colors.secondary, padding: 10, borderRadius: theme.borderRadius.md }}>
            <Text style={{ color: theme.colors.surface, fontFamily: 'Inter-SemiBold' }}>Download Weekly PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overall Summary Card */}
      <View style={[styles.summaryCard, theme.shadows.md]}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Overall Satisfaction</Text>
            <Text style={styles.summaryMonth}>{monthName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={styles.statusEmoji}>{status.emoji}</Text>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.bigStat}>
          <Text style={[styles.bigNumber, { color: status.color }]}>{satisfactionRate}%</Text>
          <Text style={styles.bigLabel}>Students Enjoyed Meals</Text>
        </View>

        <View style={styles.totalRecords}>
          <Text style={styles.totalIcon}>📝</Text>
          <Text style={styles.totalText}>{summary.total} Total Records</Text>
        </View>
      </View>

      {/* Detailed Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Meal Response Breakdown</Text>
        
        <StatCard
          emoji="😊"
          label="Enjoyed Meal"
          count={summary.happy}
          percentage={percent(summary.happy)}
          color={theme.colors.success}
          delay={0}
        />

        <StatCard
          emoji="😐"
          label="Ate a Little"
          count={summary.little}
          percentage={percent(summary.little)}
          color={theme.colors.secondary}
          delay={100}
        />

        <StatCard
          emoji="😞"
          label="Didn't Eat"
          count={summary.none}
          percentage={percent(summary.none)}
          color={theme.colors.error}
          delay={200}
        />
      </View>

      {/* Quick Insights */}
      {summary.total > 0 && (
        <View style={[styles.insightsCard, theme.shadows.sm]}>
          <Text style={styles.insightsTitle}>💡 Quick Insights</Text>
          
          <View style={styles.insightRow}>
            <Text style={styles.insightIcon}>✓</Text>
            <Text style={styles.insightText}>
              {summary.happy} students ({percent(summary.happy)}%) fully enjoyed their meals
            </Text>
          </View>

          {summary.little > 0 && (
            <View style={styles.insightRow}>
              <Text style={styles.insightIcon}>⚠</Text>
              <Text style={styles.insightText}>
                {summary.little} students need encouragement to eat more
              </Text>
            </View>
          )}

          {summary.none > 0 && (
            <View style={styles.insightRow}>
              <Text style={styles.insightIcon}>!</Text>
              <Text style={styles.insightText}>
                {summary.none} students didn't eat - may need attention
              </Text>
            </View>
          )}

          {satisfactionRate >= 80 && (
            <View style={[styles.congratsBox, { backgroundColor: theme.colors.success + '10' }]}>
              <Text style={styles.congratsText}>
                🎉 Great job! Satisfaction rate is excellent this month!
              </Text>
            </View>
          )}
        </View>
      )}

      {summary.total === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No Data Yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking meals to see reports here
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  header: { 
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  title: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 24, 
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  summaryMonth: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 16,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  bigStat: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  bigNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 56,
    lineHeight: 64,
  },
  bigLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  totalRecords: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  totalIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  totalText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  statsSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  emoji: {
    fontSize: 28,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  statCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginRight: theme.spacing.xs,
  },
  statPercentage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBg: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  insightsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  insightsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  congratsBox: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  congratsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.success,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  circularContainer: {
    alignItems: 'center',
  },
  circularBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularFill: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularPercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: theme.colors.text.inverse,
  },
  circularLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});