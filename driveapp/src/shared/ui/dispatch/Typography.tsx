import { Text, type TextProps } from 'react-native';

export function LabelCaps(props: TextProps) {
  const { className, ...rest } = props;
  return (
    <Text
      className={`font-sans text-label-caps font-bold uppercase tracking-widest text-foreground-muted ${className ?? ''}`}
      {...rest}
    />
  );
}

export function Mono(props: TextProps) {
  const { className, ...rest } = props;
  return (
    <Text className={`font-mono text-technical text-primary ${className ?? ''}`} {...rest} />
  );
}

export function DisplayTitle(props: TextProps) {
  const { className, ...rest } = props;
  return (
    <Text
      className={`font-sans text-display-lg font-bold text-foreground ${className ?? ''}`}
      {...rest}
    />
  );
}

export function Headline(props: TextProps) {
  const { className, ...rest } = props;
  return (
    <Text
      className={`font-sans text-headline-md font-semibold text-foreground ${className ?? ''}`}
      {...rest}
    />
  );
}

export function BodyText(props: TextProps) {
  const { className, ...rest } = props;
  return (
    <Text className={`font-sans text-body-md text-foreground-secondary ${className ?? ''}`} {...rest} />
  );
}
