import { Text, type TextProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  className?: string;
};

const defaultTextClass = 'text-text dark:text-textDark';

const typeStyles = {
  default: 'text-base leading-6',
  defaultSemiBold: 'text-base leading-6 font-semibold',
  title: 'text-3xl font-bold leading-8',
  subtitle: 'text-xl font-bold',
  link: 'leading-8 text-base text-tint dark:text-tintDark',
};

export function ThemedText({
  style,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      className={twMerge(defaultTextClass, typeStyles[type], className)}
      style={style}
      {...rest}
    />
  );
}
