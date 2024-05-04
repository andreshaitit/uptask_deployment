const passport = require("passport");
const Usuarios = require("../models/Usuarios");
const crypto = require("crypto");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require("../handlers/email");

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Todos los campos son obligatorios'
})

// Funcion para revisar si el usuario esta logueado o no
exports.usuarioAutenticado = (req, res, next) => {
    // si el usuario esta autenticado, adelante
    if(req.isAuthenticated()){
        return next();
    }
    // sino esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

// Funcion para cerrar sesion

exports.cerrarSesion = (req, res) => {
    req.session.destroy(()=>{
        res.redirect('/iniciar-sesion'); //al cerrar sesion nos lleva al login
    })
}

// genera un token si el usuario es valido
exports.enviarToken = async (req, res) => {
    const {email} = req.body;
    const usuario = await Usuarios.findOne({where: {email}})
    
    // Si no existe el usuario
    if(!usuario) {
        req.flash('error', 'No existe esa cuenta');
        return res.redirect('/reestablecer');
    }
    
    //usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expiracion = Date.now() + 3600000;
    
    // guardarlos en la base de datos
    await usuario.save();
    
    // url de reset
    const resetUrl = `http://${req.headers.host}/reestablecer/${usuario.token}`;
    // enviar el correo con el token
    
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo : 'reestablecer-password.pug'
    })
    
    req.flash('correcto', 'Se envió un mensaje a tu correo');
    res.redirect('/iniciar-sesion');
}

exports.validarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    })
    
    if(!usuario) {
        req.flash('error', 'No Válido');
        res.redirect('/restablecer');
    }
    
    // Formulario para generar el password
    res.render('resetPassword', {
        nombrePagina : 'Reestablecer Contraseña'
    })
}


// cambia el password por uno nuevo

exports.actualizarPassword = async (req, res) => {
    // Verifica el token valido pero tambien la fecha de expiracion
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiracion: {
                [Op.gte] : Date.now()
            }
        }
    });
    
    if(!usuario) {
        req.flash('error', 'No Válido');
        res.redirect('/restablecer');
    }
    
    // hashear el nuevo password
    
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null,
    usuario.expiracion= null;
    
    // guardamos el nuevo password
    
    await usuario.save();
    
    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');
    
}