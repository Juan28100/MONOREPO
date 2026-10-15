// Responsibilidad: se tienen la ruta del crud de articulos (recibe la peticion -> viaja a SQL -> Responde)
import { response, Router } from "express";
import {baseDatos} from "./baseDatos.js"
import { subirImagen, borrarImagen } from "./subirImagen.js";

const rutas = Router()

// Si una funcion falla, responde con error 500 en vez de dejar la peticion colgada.
const conManejoDeErrores  = funcion => (peticion, respuesta) =>
    funcion(peticion, respuesta).catch(error =>{
        console.error(error)
        respuesta.status(500).json({error: "Error del servidor: " + error.message})
    })

// convierte lo que llega del formulario (todo llega como texto) en numeros y los valida
function leerCampos(cuerpo){
    const articulo = {
        nombre: (cuerpo.nombre ?? "").trim(),
        descripcion: (cuerpo.nombre ?? "").trim(),
        precio_compra: Number(cuerpo.precio_compra),
        precio_venta: Number(cuerpo.precio_venta),
        stock_minimo: Number(cuerpo.stock_minimo),
        stock_maximo: Number(cuerpo.stock_maximo),
    }
    let mesajeError = null
    if (!articulo.nombre) mensajeError = "El nombre es obligatorio"
    else if (!(articulo.precio_compra >= 0) || !(articulo.precio_venta >=0)) mensajeError = "Los precios deben ser numeros positivos"
    else if (!(articulo.stock_minimo >= 0) || !(articulo.stock_maximo >=0)) mensajeError = "El stock debe ser un numero positivo"
    else if (articulo.stock_minimo > articulo.stock_maximo) mesajeError = "El stock minimo no puede ser mayor que el stock maximo"
    return {articulo, mensajeError}
}

// Listar (Read) Todos los articuls
rutas.get("/", conManejoDeErrores(async(peticion, respuesta)=>{
    const [filas] = await baseDatos.query("SELECT * FROM articulos ORDER BY id DESC")
    respuesta.json(filas)
}))

//Listar UNO por su ID (Read ID)
rutas.get("/:id", conManejoDeErrores(async(peticion, respuesta)=>{
    const [filas] = await baseDatos.query("SELECT * FROM articulos WHERE id = ?", [peticion.params.id])
    if (!filas.length) return respuesta.status(404).json({error: "Articulo no encontrado"})
    respuesta.json(filas[0])
}))

// Crear (Create) El formulario llega como multipart: los textos en peticion.body y el archivo en peticion.file.
rutas.post("/", subirImagen.single("imagen"), conManejoDeErrores(async(peticion, respuesta) => {
    const {articulo, mensajeError}=leerCampos(peticion.body)
    if (mensajeError){
        if(peticion.file) borrarImagen("/uploads/" + peticion.file.filename)
            return respuesta.status(400).json({error: mensajeError})
    }
    const imagen = peticion.file ? "/uploads/" + peticion.file.filename : null
    const [resultado] = await baseDatos.query(
        `INSERT INTO articulos (nombre, descripcion, precio_compra, precio_venta, stock_minimo, stock_maximo, imagen)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [articulo.nombre, articulo.descripcion, articulo.precio_compra, articulo.precio_venta, articulo.stock_minimo, articulo.stock_maximo, imagen],
    )
    respuesta.status(201).json({id: resultado.insertId, ...articulo, imagen})
}))

// Editar (update) Si no se envia una imagen nueva 
rutas.put("/:id", subirImagen.single("imagen"), conManejoDeErrores (async(peticion, respuesta) => {
    const imagenNueva = peticion.file ? "/uploads/" + peticion.file.filename : null
    const [filas] = await baseDatos.query("SELECT * FROM articulos WHERE id = ?", [peticion.params.id])
    if (!filas.length) {
        borrarImagen(imagenNueva)
        return respuesta.status(404).json({error: "articulo no encontrado"})
    }
    const {articulo, mensajeError} = leerCampos(peticion.body)
    if(mensajeError){
    borrarImagen(imagenNueva)
    return respuesta.status(400).json({error: mensajeError})
    }
    const imagen=imagenNueva ?? files[0].imagen
    await baseDatos.query(
        `UPDATE articulos SET nombre=?, descripcion=?, precio_compra=?, precio_venta=?, stock_minimo=?,
        stock_maximo=?, imagen=?, WHERE id=?,`
        [articulo.nombre, articulo.descripcion, articulo.precio_compra, articulo.precio_venta, articulo.stock_minimo, articulo.stock_maximo, imagen, peticion.params.id],
    )
if (imagenNueva) borrarImagen(files[0].imagen) // Reemplaza la foto y se borra la imagen viaja.
respuesta.json({id: Number(peticion.params.id), ...articulo, imagen})
}))

// Eliminar (Delete) Este metodo tambien borra la foto del disco
rutas.delete("/:id", conManejoDeErrores(async(peticion, respuesta)=>{
    const [filas] = await  baseDatos.query("SELECT imagen FROM articulos WHERE id = ?", [peticion.params.id])
    if(!filas.length) return respuesta.status(404).json({error: "Articulo no encontrado"})
        await baseDatos.query("SELECT FROM articulos WHERE id = ?", [peticion.params.id])
    borrarImagen(filas[0].imagen)
    respuesta.json({ok:true})

}))

export default rutas