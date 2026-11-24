import * as React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { nativeShadowStyle, nativeTextStyle, themeMotion } from "@/theme/helpers";
import { ToastType, useToast } from '@components';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VARIANTS: Record<string, string> = {
	[ToastType.Info]: 'info',
	[ToastType.Error]: 'error',
	[ToastType.Success]: 'success',
};

export const Toast: React.FC = () => {
	const theme: any = useTheme();
	const toast = theme.native.components.toast;
	const motion = React.useMemo(() => themeMotion(theme, 'base'), [theme]);
	// The toast's own speed; none when it is not animated or the theme turns motion off.
	const duration = toast.base.animated && motion.duration ? toast.base.speed : 0;
	const styles = React.useMemo(() => toastStyles(toast), [toast]);
	const insets = useSafeAreaInsets();
	const [toastConfig, { hideToast }] = useToast();
	const opacity = React.useRef(new Animated.Value(0)).current;

	const fadeIn = React.useCallback(() => {
		Animated.timing(opacity, {
			toValue: 1,
			duration,
			easing: motion.easing,
			useNativeDriver: true,
		}).start();
	}, [opacity, duration, motion.easing]);

	const fadeOut = React.useCallback(() => {
		Animated.timing(opacity, {
			toValue: 0,
			duration,
			easing: motion.easing,
			useNativeDriver: true,
		}).start(() => {
			hideToast && hideToast();
		});
	}, [opacity, hideToast, duration, motion.easing]);

	React.useEffect(() => {
		if (!toastConfig) {
			return;
		}

		fadeIn();
		const timer = setTimeout(fadeOut, toastConfig.duration);

		return () => clearTimeout(timer);
	}, [toastConfig, fadeIn, fadeOut]);

	if (!toastConfig) {
		return null;
	}

	const { type, message } = toastConfig;

	const variant = toast.variants[VARIANTS[type]] ?? toast.variants.info;

	return (
		<Animated.View
			style={[
				styles.container,
				{ bottom: insets.bottom + toast.base.offset, opacity },
			]}
		>
			<View style={[styles.toast, { backgroundColor: variant.background }]}>
				<Text maxFontSizeMultiplier={1.3} style={[styles.message, { color: variant.color }]}>{message}</Text>
			</View>
		</Animated.View>
	);
};

const toastStyles = (toast: any) => StyleSheet.create({
	container: {
		alignSelf: "center",
		position: "absolute",
		maxWidth: toast.base.max_width,
		zIndex: 9999,
	},
	toast: {
		borderRadius: toast.base.radius,
		padding: toast.base.padding,
		...nativeShadowStyle(toast.base.shadow),
	},
	message: {
		...nativeTextStyle(toast.base.text),
		textAlign: "center",
	},
});
