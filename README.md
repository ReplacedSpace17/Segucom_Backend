Table Ubicaciones {
  Ubicacion_ID varchar [pk]
  PersonalID varchar
  Latitud varchar 
  Longitud varchar
  Hora time
  Fecha date
}

Table Personal {
  PersonalID varchar [pk]
  No_Empleado int(6) 
  Nombre varchar
  Telefono varchar (10)
  IMEI varchar
  Clave varchar
  
}
dsds


Ref: Personal.PersonalID < Ubicaciones.PersonalID// many-to-one

