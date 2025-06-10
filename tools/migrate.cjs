const url = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?search_path=public&sslmode=disable`;

require('child_process').execSync(`npx dbmate -u "${url}" ${process.argv.slice(2).join(' ')}`, {
  stdio: 'inherit',
});
