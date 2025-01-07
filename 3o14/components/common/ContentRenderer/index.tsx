import { Platform } from 'react-native';
import { WebContentRenderer } from './WebContentRenderer';
import { NativeContentRenderer } from './NativeContentRenderer';
import type { ContentRendererProps } from './types';

export const ContentRenderer: React.FC<ContentRendererProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebContentRenderer {...props} />
    : <NativeContentRenderer {...props} />;
};
