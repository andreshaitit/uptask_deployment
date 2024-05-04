const Proyectos = require('../models/Proyectos');
const Tareas = require('../models/Proyectos');

exports.agregarTarea = async (req, res, next) => {
    // obtenemos el Proyecto actual    
    const proyecto = await Proyectos.findOne({where: { url: req.params.url}});
    
    // leer el valor del input
    const {tarea} = req.body;
    
    // estado 0 = imcompleto y id de Proyecto
    const estado = 0;
    const proyectoId = proyecto.id;
    
    // insertar en la bd
    
    const resultado = Tareas.create({ tarea, estado, proyectoId});
    
    if(!resultado){
        return next()
    }
    
    // redireccionar
    
    res.redirect(`/proyectos/${req.params.url}`)
    
}

exports.cambiarEstadoTarea = async (req, res) => {
    const {id} = req.params;
    const tarea = await Tareas.findOne({where: {id}})
    
    // Cambiar el estado
    let estado = 0;
    if(tarea.estado === estado) {
        estado = 1;
    }
    
    tarea.estado=estado;
    
    const resultado = await tarea.save();
    
    if(!resultado) return next();
    
    res.status(200).send('Todo bien...');
}

exports.eliminarTarea = async (req, res) => { 
    
    const {id} = req.params;
    
    // Eliminar Tarea
    
    const resultado = await Tareas.destroy({where: {id}});
    
    if(!resultado) return next();
    
    res.status(200).send('Tarea Eliminada')
}