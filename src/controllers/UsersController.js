const connection = require('../database/connection');
const bcrypt = require('bcrypt');
const saltRounds = 10;
require('dotenv/config');

module.exports = {       
    
    async signIn(request, response) {
        let email = request.body.email;
        let senha = request.body.password;

        //console.log('Email:', email);
        //console.log('Password:', senha);

        const usuario = await connection('usuarios')
            .where('usrEmail', email) 
            .select(`usrId`, `usrNome`, `usrEmail`, `usrPassword`, `usrSldDisponivel`)
            .first();
        
        if (!usuario) {            
            return response.status(400).json({ error: 'Não encontrou usuário com este ID'});
        } 

        //console.log(user.usrPassword)
        //let pass = usuario.usrPassword;
        //const match = await bcrypt.compare(senha, pass)

        //if(!match) {
        //    return response.status(403).send({ auth: false, message: 'User invalid!' });
        //}

        const user = {
            id: usuario.usrId,
            name: usuario.usrNome,
            email: usuario.usrEmail,
            saldo: usuario.usrSldDisponivel
        }

        //let token = jwt.sign({ id: user.usrId, name: user.usrNome, email: user.usrEmail, nivel: user.usrNivAcesso }, process.env.SECRET_JWT, {
        //    expiresIn: '1h'
        //});
        //let refreshToken = jwt.sign({ id: user.usrId, name: user.usrNome, email: user.usrEmail, nivel: user.usrNivAcesso  }, process.env.SECRET_JWT_REFRESH, {
        //    expiresIn: '2h'
        //});
        //console.log(user);
        
        return response.json(user);

    },

    async loginCPF(request, response) {
        let cpf = request.body.qrCpf;

        //console.log('qrCpf:', cpf);

        const usuario = await connection('usuarios')
            .where('usrCpf', cpf) 
            .select(`usrId`, `usrNome`, `usrEmail`, `usrPassword`, `usrSldDisponivel`)
            .first();
        
        if (!usuario) {            
            return response.status(400).json({ error: 'Não encontrou usuário com este ID'});
        } 

        //console.log(user.usrPassword)
        //let pass = usuario.usrPassword;
        //const match = await bcrypt.compare(senha, pass)

        //if(!match) {
        //    return response.status(403).send({ auth: false, message: 'User invalid!' });
        //}

        const user = {
            id: usuario.usrId,
            name: usuario.usrNome,
            email: usuario.usrEmail,
            saldo: usuario.usrSldDisponivel
        }

        //let token = jwt.sign({ id: user.usrId, name: user.usrNome, email: user.usrEmail, nivel: user.usrNivAcesso }, process.env.SECRET_JWT, {
        //    expiresIn: '1h'
        //});
        //let refreshToken = jwt.sign({ id: user.usrId, name: user.usrNome, email: user.usrEmail, nivel: user.usrNivAcesso  }, process.env.SECRET_JWT_REFRESH, {
        //    expiresIn: '2h'
        //});
        //console.log(user);
        
        return response.json(user);

    },

    async newuser(request, response) {
        console.log(request.body);
        const {nome, cpf, nascimento, email, celular , password} = request.body;
        let saldo = 0.00;
        let status = 'A'; 
        let snhCrypt = await bcrypt.hash(password, saltRounds);
        const [usrId] = await connection('usuarios').insert({
            usrNome: nome, 
            usrEmail: email, 
            usrCpf: cpf, 
            usrCelular: celular, 
            usrNascimento: nascimento, 
            usrPassword: snhCrypt, 
            usrSldDisponivel: saldo, 
            usrStatus: status  
        });
           
        return response.json({usrId});
    },

    async searchUser(request, response) {
        let cpf = request.params.cpf;

        const user = await connection('usuarios')
            .where('usrCpf', cpf)
            .select('usrId','usrNome','usrNascimento' )
            .first();
          
        if (!user) {
            return response.status(400).json({ error: 'Não encontrou usuário c/ este CPF'});
        } 

        return response.json(user);
    }, 
    
    async busUser(request, response) {
        let id = request.params.idUsr;

        const datAtual = new Date();
        const day = String(datAtual.getDate()).padStart(2, '0');
        const month = String(datAtual.getMonth() + 1).padStart(2, '0');
        const year = datAtual.getFullYear();

        const hours = String(datAtual.getHours()).padStart(2, '0');
        const minutes = String(datAtual.getMinutes()).padStart(2, '0');
        const seconds = String(datAtual.getSeconds()).padStart(2, '0');
       
        const user = await connection('usuarios')
            .where('usrId', id)
            .select('usrId','usrNome','usrNascimento', 'usrCpf' )
            .first();
          
        if (!user) {
            return response.status(400).json({ error: 'Não encontrou usuário c/ este CPF'});
        } 

        const dados = year + seconds + minutes + month + day + user.usrCpf + hours + id + user.usrNome 

        //console.log(dados);

        return response.json(dados);
    },
};
