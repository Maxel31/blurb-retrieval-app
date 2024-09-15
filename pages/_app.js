import { ChakraProvider, extendTheme } from "@chakra-ui/react";

// デフォルトテーマを拡張する場合
const theme = extendTheme({
  colors: {
    blackAlpha: {
      600: "rgba(0, 0, 0, 0.6)", // 必要に応じてカスタムカラーを定義
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}> {/* テーマを適用 */}
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;