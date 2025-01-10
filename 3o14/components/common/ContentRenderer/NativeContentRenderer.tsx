// @ts-ignore
import MathJax from 'react-native-mathjax';
import { useTheme } from '@/hooks/useTheme';
import { mmlOptions } from './MathJaxConfig';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import type { ContentRendererProps } from './types';

const containsLatexDelimiters = (content: string): boolean => {
  // Check for display math \[ \] or inline math \( \) 
  // Using regex with 's' flag to match across multiple lines
  const displayMathPattern = /\\\[[\s\S]*?\\\]/;
  const inlineMathPattern = /\\\([\s\S]*?\\\)/;

  return displayMathPattern.test(content) || inlineMathPattern.test(content);
};

export const NativeContentRenderer: React.FC<ContentRendererProps> = ({
  content,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const tagsStyles = {
    body: {
      color: theme.colors.text,
      marginLeft: 8,
      fontSize: 16,
    },
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'none' as const,
    },
    p: {
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
  };

  // MathJax styling
  const mathJaxStyle = `
    <style>
      html, body {
        margin: 4;
        padding: 0;
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }
      #MathJax_Message {
        display: none !important;
      }
      .MathJax {
        display: inline-block;
        font-size: 1rem;
        line-height: 1.5;
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }
      .MathJax_Preview {
        background-color: ${theme.colors.background} !important;
        color: ${theme.colors.text};
      }
      .MathJax_Processing {
        display: none !important;
      }
      a {
        color: ${theme.colors.primary};
      }
      * {
        background-color: ${theme.colors.background} !important;
      }
    </style>
  `;

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

  // Wrap content for MathJax
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

  const hasMathContent = containsLatexDelimiters(content);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {hasMathContent ? (
        <MathJax
          style={styles.mathJax}
          mathJaxOptions={enhancedMmlOptions}
          html={wrappedContent}
        />
      ) : (
        <RenderHtml
          contentWidth={width}
          source={{ html: content }}
          tagsStyles={tagsStyles}
        />
      )}
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
