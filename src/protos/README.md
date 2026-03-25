## 配置 protobuf

使用 [@bufbuild/protoc-gen-es](https://www.npmjs.com/package/@bufbuild/protoc-gen-es) 与项目根目录的 `buf.gen.yaml` 从 `.proto` 生成 TypeScript（输出到 `src/protos/gen/`）。

### 在仓库根目录执行

```bash
npm run proto:generate
```

修改 `src/protos/modules/*.proto` 后需重新执行上述命令以更新 `gen/` 下的生成文件。
