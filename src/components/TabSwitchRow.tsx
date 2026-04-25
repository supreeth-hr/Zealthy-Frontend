import { Pressable, Text, View } from "react-native";
import { ui } from "../ui/styles";

type TabOption<T extends string> = {
  key: T;
  label: string;
};

type TabSwitchRowProps<T extends string> = {
  activeTab: T;
  options: TabOption<T>[];
  onSelect: (tab: T) => void;
};

export const TabSwitchRow = <T extends string>({ activeTab, options, onSelect }: TabSwitchRowProps<T>) => (
  <View style={ui.tabRow}>
    {options.map((option) => (
      <Pressable
        key={option.key}
        style={[ui.tabButton, activeTab === option.key ? ui.tabButtonActive : ui.tabButtonInactive]}
        onPress={() => onSelect(option.key)}
      >
        <Text style={activeTab === option.key ? ui.tabLabelActive : ui.tabLabelInactive}>{option.label}</Text>
      </Pressable>
    ))}
  </View>
);
