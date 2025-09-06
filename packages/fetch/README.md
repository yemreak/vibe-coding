# @yemreak/fetch

```bash
bun add -g @yemreak/fetch
```

## Usage

```bash
yfetch "https://developer.apple.com/documentation/activitykit"
```

## Examples

```bash
yfetch "https://example.com"
echo "https://api.github.com" | yfetch -
curl -s https://api.github.com/users/torvalds | jq -r .blog | yfetch -
```

[GitHub](https://github.com/yemreak/tools)