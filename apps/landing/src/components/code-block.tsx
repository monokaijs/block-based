import { codeToHtml } from "shiki";

export async function CodeBlock({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const lang = className?.replace("language-", "") ?? "text";

  const html = await codeToHtml(children.trim(), {
    lang,
    theme: "github-dark-default",
  });

  return (
    <div
      className="[&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:my-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
