// @ts-ignore
import MathJax from 'react-native-mathjax';
import { useTheme } from '@/hooks/useTheme';
import { mmlOptions } from './MathJaxConfig';
import { View, StyleSheet } from 'react-native';
import type { ContentRendererProps } from './types';

export const NativeContentRenderer: React.FC<ContentRendererProps> = ({
  content,
}) => {
  const theme = useTheme();

  // 1. Comprehensive styling to prevent white flash
  const mathJaxStyle = `
    <style>
      /* Root level background control */
      html, body {
        margin: 4;
        padding: 0;
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }

      /* WebView container background */
      #MathJax_Message {
        display: none !important;
      }

      /* MathJax specific styling */
      .MathJax {
        display: inline-block;
        font-size: 1rem;
        line-height: 1.5;
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }

      /* MathJax preview elements */
      .MathJax_Preview {
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }

      /* MathJax processing message suppression */
      .MathJax_Processing {
        display: none !important;
      }

      /* Additional element styling */
      a {
        color: ${theme.colors.primary};
      }

      /* Force background on any dynamically created elements */
      * {
        background-color: ${theme.colors.background} !important;
      }
    </style>
  `;

  // 2. Enhanced MathJax configuration
  const enhancedMmlOptions = {
    ...mmlOptions,
    showProcessingMessages: false,
    messageStyle: 'none',
    styles: {
      '.MathJax': {
        backgroundColor: theme.colors.background,
      }
    },
  };

  // 3. Wrap content in container with background control
  const wrappedContent = `
    <html>
      <head>
        ${mathJaxStyle}
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MathJax
        style={styles.mathJax}
        mathJaxOptions={enhancedMmlOptions}
        html={wrappedContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  mathJax: {
    flex: 1,
    width: '100%',
  },
});
