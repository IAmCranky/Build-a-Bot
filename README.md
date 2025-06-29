# Build-a-Bot  
An open-source framework for building your very own Discord bot.

> **Note:**  
> This guide does **not** cover how to create, authenticate, or add a bot to your Discord server.  

---

## 1. Setting Up the Environment

### Requirements

- **Node.js** is required. [Download here](https://nodejs.org/en/download).
- The project and required extensions should already be initialized in `package.json`.

If you have trouble, follow these steps:

**Initialize the package:**
```sh
npm init -y
```

**Requirements.txt contains the needed exetnsions to install:**
```sh
cat requirements.txt | xargs npm install -g
```


### Authentication:

.env contains a "token" variable. You will need to add the Token ID of your Discord bot to authenticate it for use on your server.

- Inside of users.json:

    - replace the default text with your Discord user ID number. 
    - This will authenticate you to run admin-level commands.


- bot.js is the mian script. To start the bot:
```sh
npm bot.js
```
