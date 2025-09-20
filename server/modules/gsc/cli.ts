#!/usr/bin/env node
const { index } = require(".");
const { Command } = require("commander");
const packageJson = require("./package.json");
const { green } = require("picocolors");

const program = new Command(packageJson.name);

program
  .alias("gsc")
  .version(packageJson.version, "-v, --version", "Hiển thị version.")
  .description(packageJson.description)
  .argument("[input]")
  .usage(`${green("[input]")} [options]`)
  .helpOption("-h, --help", "Hiển thị thông tin hướng dẫn.")
  .option("-c, --client-email <email>", "Địa chỉ email của tài khoản dịch vụ Google.")
  .option("-k, --private-key <key>", "Khoá riêng (private key) của tài khoản dịch vụ Google.")
  .option("-p, --path <path>", "Đường dẫn tới file chứa thông tin xác thực của tài khoản dịch vụ Google.")
  .option("-u, --urls <urls>", "Danh sách URL cần index, phân tách bằng dấu phẩy.")
  .option("--rpm-retry", "Thử lại khi vượt quá giới hạn tần suất (rate limit).")
  .action((input, options) => {
    index(input, {
      client_email: options.clientEmail,
      private_key: options.privateKey,
      path: options.path,
      urls: options.urls ? options.urls.split(",") : undefined,
      quota: {
        rpmRetry: options.rpmRetry,
      },
    });
  })
  .parse(process.argv);
