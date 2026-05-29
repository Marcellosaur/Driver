import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

const typeClass: Record<NonNullable<ThemedTextProps['type']>, string> = {
  default: 'text-base leading-6 text-foreground',
  defaultSemiBold: 'text-base font-semibold leading-6 text-foreground',
  title: 'text-[32px] font-bold leading-8 text-foreground',
  subtitle: 'text-xl font-bold text-foreground',
  link: 'text-base leading-[30px] text-link',
};

export function ThemedText({ type = 'default', className, ...rest }: ThemedTextProps) {
  return <Text className={`${typeClass[type]} ${className ?? ''}`} {...rest} />;
}
