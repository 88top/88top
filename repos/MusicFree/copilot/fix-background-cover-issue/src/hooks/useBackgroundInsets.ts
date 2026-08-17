import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Hook that returns negative safe area insets for extending backgrounds
 * beyond safe area boundaries to cover the entire screen.
 */
export default function useBackgroundInsets() {
    const insets = useSafeAreaInsets();
    
    return {
        top: -insets.top,
        bottom: -insets.bottom,
        left: -insets.left,
        right: -insets.right,
    };
}
