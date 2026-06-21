import { View, Pressable, Text } from "react-native";
import { colors } from "@/lib/theme";

export function StarRating({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const star = (
          <Text style={{ fontSize: size, color: filled ? colors.trail500 : colors.ink600 }}>
            {filled ? "★" : "☆"}
          </Text>
        );
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}
