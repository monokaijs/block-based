import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/code-block";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: ({ children, ...props }: React.ComponentProps<"pre">) => {
      // MDX wraps code in <pre><code className="language-xxx">...</code></pre>
      const child = children as React.ReactElement<{
        children?: string;
        className?: string;
      }>;
      if (child?.props?.children && typeof child.props.children === "string") {
        return (
          <CodeBlock className={child.props.className}>
            {child.props.children}
          </CodeBlock>
        );
      }
      return <pre {...props}>{children}</pre>;
    },
  };
}
