# Sudo Credential Cache Duration Configuration

By default, the operating system caches your `sudo` authorization credentials for a period of 15 minutes before prompting for password input again.

If you would like to adjust this timestamp timeout period (for example, to prevent typing passwords during long administration sessions), you can modify the system `sudoers` file:

1. Run `sudo visudo` to edit the sudo configuration file safely.
2. Add or modify the `timestamp_timeout` option. For example, to set the cache window to 30 minutes, add the following line:

   ```text
   Defaults timestamp_timeout=30
   ```

To disable caching entirely (forcing authentication on every call), set the value to `0`. Setting it to a negative value (e.g. `-1`) keeps authentication valid until the terminal session is closed.
