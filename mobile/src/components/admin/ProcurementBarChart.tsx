import React, { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { formatCompactINR } from "@/lib/format";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { ConsumptionTrendPoint } from "@/types/domain";

interface ProcurementBarChartProps {
  trends: ConsumptionTrendPoint[];
}

export function ProcurementBarChart({ trends }: ProcurementBarChartProps) {
  const { width } = useWindowDimensions();
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const chartData = useMemo(() => {
    const bars: Array<{
      value: number;
      label?: string;
      spacing?: number;
      labelWidth?: number;
      labelTextStyle?: { color: string; fontSize: number; fontWeight: "700" };
      frontColor: string;
      metricLabel: string;
      monthLabel: string;
    }> = [];

    for (const point of trends) {
      bars.push({
        value: point.wholesaleINR,
        label: point.month,
        spacing: 3,
        labelWidth: 42,
        labelTextStyle: {
          color: palette.mutedForeground,
          fontSize: 11,
          fontWeight: "700",
        },
        frontColor: palette.sky,
        metricLabel: "Wholesale B2B",
        monthLabel: point.month,
      });
      bars.push({
        value: point.retailAvoidedINR,
        spacing: 3,
        frontColor: palette.emerald,
        metricLabel: "Retail Avoided",
        monthLabel: point.month,
      });
      bars.push({
        value: point.savingsINR,
        spacing: 18,
        frontColor: palette.indigo,
        metricLabel: "Net Savings",
        monthLabel: point.month,
      });
    }

    return bars;
  }, [trends, palette.sky, palette.emerald, palette.indigo, palette.mutedForeground]);

  const maxChartVal = useMemo(() => {
    const peaks = trends.flatMap((t) => [
      t.wholesaleINR,
      t.retailAvoidedINR,
      t.savingsINR,
    ]);
    const highest = peaks.length > 0 ? Math.max(...peaks) : 50000;
    return Math.max(10000, Math.ceil((highest * 1.15) / 10000) * 10000);
  }, [trends]);

  const chartWidth = Math.max(200, Math.min(width - 132, 480));

  return (
    <ChamferCard style={{ gap: 12 }}>
      <View style={{ gap: 2 }}>
        <Text
          style={{
            color: palette.foreground,
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: -0.2,
          }}
        >
          Monthly Savings Trend
        </Text>
        <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
          B2B Wholesale vs. Retail Avoided vs. Net Savings
        </Text>
      </View>

      {/* Clean Dot Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        <LegendItem
          color={palette.sky}
          label="Wholesale"
          textColor={palette.mutedForeground}
        />
        <LegendItem
          color={palette.emerald}
          label="Retail Avoided"
          textColor={palette.mutedForeground}
        />
        <LegendItem
          color={palette.indigo}
          label="Net Saved"
          textColor={palette.mutedForeground}
        />
      </View>

      <View style={{ paddingVertical: 6, overflow: "hidden" }}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={180}
          barWidth={9}
          initialSpacing={12}
          noOfSections={4}
          maxValue={maxChartVal}
          roundedTop
          isAnimated={false}
          rulesColor={palette.border}
          xAxisColor={palette.border}
          yAxisColor="transparent"
          yAxisTextStyle={{ color: palette.mutedForeground, fontSize: 10 }}
          yAxisLabelWidth={46}
          formatYLabel={(lbl) => formatCompactINR(Number(lbl) || 0)}
          renderTooltip={(item: {
            value: number;
            metricLabel?: string;
            monthLabel?: string;
          }) => (
            <View
              style={{
                backgroundColor: palette.surfaceElevated,
                borderColor: palette.borderStrong,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 11,
                  fontWeight: "800",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {item.monthLabel} · {item.metricLabel}: {formatCompactINR(item.value)}
              </Text>
            </View>
          )}
        />
      </View>
    </ChamferCard>
  );
}

function LegendItem({
  color,
  label,
  textColor,
}: {
  color: string;
  label: string;
  textColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
      <Text style={{ color: textColor, fontSize: 11.5, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}
