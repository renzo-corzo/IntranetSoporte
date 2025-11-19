const bcrypt = require('bcryptjs');

// Simular creación de usuario admin
const crearUsuarioAdmin = async () => {
  try {
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 Usuario admin creado:');
    console.log('Username: admin');
    console.log('Password: admin');
    console.log('Password Hash:', hashedPassword);
    
    return {
      username: 'admin',
      password: hashedPassword,
      rol: 'admin'
    };
  } catch (error) {
    console.error('Error:', error);
  }
};

crearUsuarioAdmin();


