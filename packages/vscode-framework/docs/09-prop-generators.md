# Props Generators

They're generating parts of package.json that is used for launching / publishing the extension itself.

They're allows you to not store some parts or store them in the way you like.

> IDs are not generated by propsGenerators

You can look at [set of builtin generators](../src/cli/manifest-generator/propsGenerators.ts), they're all enabled by default.

## Disabling Generators

See [`config.disablePropsGenerators`](../src/config.ts)

## Custom Generators

For example. Sometimes you need to generate `activationEvents` dynamically at build time.

`config.extendPropsGenerators`
<!-- TODO! -->