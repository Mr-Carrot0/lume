export function localIp(): string | undefined {
  // Try/catch for https://github.com/denoland/deno/issues/25420
  try {
    for (const info of Deno.networkInterfaces()) {
      if (info.family !== "IPv4" || info.address.startsWith("127.")) {
        continue;
      }

      return info.address;
    }
  } catch {
    return undefined;
  }
}

export async function openBrowser(url: string): Promise<void> {
  const commands: Record<typeof Deno.build.os, string> = {
    darwin: "open",
    linux: "xdg-open",
    freebsd: "xdg-open",
    netbsd: "xdg-open",
    aix: "xdg-open",
    solaris: "xdg-open",
    illumos: "xdg-open",
    windows: "explorer",
    android: "xdg-open",
  };

  await new Deno.Command(commands[Deno.build.os], {
    args: [url],
    stdout: "inherit",
    stderr: "inherit",
  }).output();
}

export function getFreePort(port: number, limit: number): number {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    return port;
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      if (port >= limit) {
        throw new Error(`No free port found in the range ${port} to ${limit}`);
      }

      return getFreePort(port + 1, limit);
    }

    throw error;
  }
}
