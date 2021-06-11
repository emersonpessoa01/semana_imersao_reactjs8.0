const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();
// const { promisify } = require("util");
const { eAdmin } = require("./middlewares/auth");
const db = require("./models/db");
const Usuario = require("./models/Usuario");

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET", "PUT", "POST", "DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-PINGOTHER",
    "Content-Type",
    "Authorization"
  );
  app.use(cors());
  next();
});

//Visualizar todos os usuários
app.get("/usuarios", eAdmin, async (_, res) => {
  await Usuario.findAll({
    order: [["id", "DESC"]],
  })
    .then((usuarios) => {
      return res.json({
        error: false,
        mensagem: "Usuário encontrado com sucesso!",
        usuarios,
      });
    })
    .catch(() => {
      return res.json({
        error: true,
        mensagem: "Erro: Nenhum usuário encontrado!",
      });
    });
});

//Visualizar um único usuário e add eAdmin para que usuario esteja logado
app.get("/usuario/:id", eAdmin, async (req, res) => {
  await Usuario.findByPk(req.params.id)
    .then((usuario) => {
      return res.json({
        error: false,
        mensagem: "Usuário cadastrado com sucesso!",
        usuario,
      });
    })
    .catch(() => {
      return res.json({
        error: true,
        mensagem: "Erro: Usuário não cadastrado com sucesso!",
      });
    });
});

//Editar usuário
app.put("/usuario", eAdmin, async (req, res) => {
  let dados = req.body;
  return res.json({
    dados,
  });
  dados.senha = await bcrypt.hash(dados.senha);
});

app.post("/login", async (req, res) => {
  const usuario = await Usuario.findOne({
    where: {
      email: req.body.usuario,
    },
  });
  if (usuario === null) {
    return res.json({
      error: true,
      mensagem: "Error: Usuário não encontrado!",
    });
  }

  //para comparar a senha no req.body com a senha criptografada no db
  if (!(await bcrypt.compare(req.body.senha, usuario.senha))) {
    return res.json({
      error: true,
      mensagem: "Error: Senha inválida!",
    });
  }

  var token = jwt.sign({ id: usuario.id }, process.env.SECRET, {
    expiresIn: "7d", //7 dias
  });

  return res.json({
    error: false,
    mensagem: "Login realizado com sucesso!",
    token,
    // dados: req.body,
  });
});

//Cadastrar usuário por vez
app.post("/usuario", async (req, res) => {
  let dados = req.body;
  dados.senha = await bcrypt.hash(dados.senha, 8);

  await Usuario.create(dados)
    .then(() => {
      return res.json({
        error: false,
        mensagem: "Usuário cadastrado com sucesso!",
      });
    })
    .catch((err) => {
      return res.json({
        error: true,
        mensagem: "Error: Usuário não cadastrado com sucesso!" + err,
      });
    });
});

app.listen(3000, () => {
  console.log(
    "Servidor iniciado na porta 3000: http://localhost:3000/usuarios"
  );
});
