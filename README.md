### Igloo
> Feel like home while working in SNOW ;)

Igloo provides aa enviroment to carry out development on a servicenow instance from local machine using VS Code.

  - Import/Export scripts using handy shortcuts
  - Compare local code with that on local machine 
  - Traverse through included scripts smoother than ever ..!

##### How to configure

1. Install Igloo extension
2. Create a new folder for your application.
3. Create a file with name "iglooconfig.txt" with the followint content
    ```
    {
        "url" : "<your instance URL>",
        "username" : "<username>",
        "password" : "<password>",
        "app_name" : "<Name of the application you want to manage"
    }
    ```
4. Open the folder in VS Code and verify the extension being loaded from the message "Igloo : active" in the status bar.

##### Usage

```
Pull all the scripts from server
Ctrl + Alt + a
```

```
Push a script to server
While focused in the file, press Crtl + Alt + e
```

```
Load refered or extended script
Eg. var x = new SomeScript()
To view the SomeScript file, select text 'SomeScript' and press Ctrl + Alt  + f
```

```
Compare script with that on server
While focused on the file, press Ctrl + Alt + d
(Current loading only the file from the script in a new window. Aiming to give diff support in next version.)
```
