import User from '@/app/schemas/user';

export async function initialize() {
  const email = "admin@compjunior.br";

  User.findOne({ email })
    .then(userData => {
      if (!userData) {
        User.create({
          name: "Admin",
          email: "admin@compjunior.br",
          password: "123",
          isAdmin: true,
        })
          .then(
            console.log("Admin criado com sucesso")
          )
          .catch(error => {
            console.error('Erro ao salvar admin', error);
          });
      }
    })
    .catch(error => {
      console.error('Erro ao consultar admin no banco de dados', error);
    });
}