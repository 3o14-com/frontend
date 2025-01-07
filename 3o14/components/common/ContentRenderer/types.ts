import type { MixedStyleDeclaration } from 'react-native-render-html';

export interface ContentRendererProps {
  content: string;
  width: number;
  tagsStyles: Record<string, MixedStyleDeclaration>;
  renderersProps: any;
  systemFonts: string[];
}
