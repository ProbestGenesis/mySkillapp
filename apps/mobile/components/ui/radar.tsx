import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { MotiView } from "moti";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  color?: string;
  style?: ViewStyle;
}

const ANIMATION_DURATION = 3500;

function RippleCircle({
  size,
  opacity,
  delay,
  borderStyle,
  color,
}: {
  size: number;
  opacity: number;
  delay: number;
  borderStyle: "solid" | "dashed";
  color: string;
}) {
  return (
    <MotiView
      from={{ scale: 0.5, opacity }}
      animate={{ scale: 1.4, opacity: 0 }}
      transition={{
        type: "timing",
        duration: ANIMATION_DURATION,
        delay,
        repeatReverse: false,
        loop: true,
      }}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderStyle,
          borderColor: color,
          backgroundColor: `${color}22`,
        },
      ]}
    />
  );
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 80,
  mainCircleOpacity = 0.5,
  numCircles = 6,
  color = "#6366f1",
  style,
}: RippleProps) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {Array.from({ length: numCircles }, (_, i) => (
        <RippleCircle
          key={i}
          size={mainCircleSize + i * 60}
          opacity={Math.max(0, mainCircleOpacity - i * 0.07)}
          delay={i * 200}
          borderStyle={i === numCircles - 1 ? "dashed" : "solid"}
          color={color}
        />
      ))}
    </View>
  );
});

Ripple.displayName = "Ripple";

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderWidth: 1,
  },
});

export default Ripple;