import type { CommandsExport } from ".";
import { modifyJsonFile } from 'modify-json-file';
import path from 'path';
import gitRemoteOriginUrl from "git-remote-origin-url"

interface Options {
    /**
     * - original - update root's package.json (changes will be commited)
     * (soon) - vsce - update package.json that inside VSIX package (I'll recommend this approach in the future)
     * or provide custom path to package.json
     */
    where: "original" | { path: string }
    commands: CommandsExport
    /** @default [] - Updates all fields */
    updateFields?: ("repository" | "contributes.commands" | "activationEvents" | "engines")[]
}

export const updatePackageJson = async ({ where, commands, updateFields = [] }: Options) => {
    const packageJsonFile = path.join(__dirname, typeof where === "string" && where === "original" ? 'package.json' : where.path);

    await modifyJsonFile(packageJsonFile, async json => {
        const updateFieldsExecutors: Record<(typeof updateFields)[number], () => unknown> = {
            repository: async () => {
                let githubRepoUrl = await gitRemoteOriginUrl();

                if (githubRepoUrl.endsWith(".git")) githubRepoUrl = githubRepoUrl.slice(0, -".git".length);
                json.repository = githubRepoUrl;
            },
            engines() {
                json.engines = {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    vscode: `^${require('@types/vscode/package.json').version}`
                };
            },
            "contributes.commands": () => {
                const commandPrefix: string = json.name;
                const displayName: string = json.displayName;
                json.contributes.commands = commands.regular.map(({ command, title }) => {
                    return {
                        // category: category ? displayName : category,
                        category: displayName,
                        command: `${commandPrefix}.${command}`,
                        title
                    };
                });
            },
            activationEvents() {
                type ContributedCommand = Record<'category' | 'command' | 'title', string>;
                const allCommands = (json.contributes.commands as ContributedCommand[]).map(({ command }) => command);
                // TODO would override custom commands
                if (json.activationEvents[0] === 'onCommands' || json.activationEvents.every((event: string) => event.startsWith('onCommand:'))) {
                    json.activationEvents = allCommands.map(command => `onCommand:${command}`);
                }
            }
        }

        if (updateFields.length === 0) updateFields = Object.keys(updateFieldsExecutors);

        for (const prop of updateFields) {
            await updateFieldsExecutors[prop]();
        }
        
        return json;
    });
};