const MOCK_CITIZENS = {
    "107410586": { name: "Diego Jimenez Ajun", birthDate: "1988-11-23", gender: "Masculino" },
    "502310299": { name: "Roldan Ajun Chaverri", birthDate: "1980-06-12", gender: "Masculino" },
    "118920453": { name: "Carlos Alvarado Quesada", birthDate: "1980-01-14", gender: "Masculino" },
    "109870654": { name: "Laura Chinchilla Miranda", birthDate: "1959-03-28", gender: "Femenino" },
    "207650432": { name: "Oscar Arias Sanchez", birthDate: "1940-09-13", gender: "Masculino" },
    "301020304": { name: "Luis Guillermo Solis Rivera", birthDate: "1958-04-25", gender: "Masculino" },
    "402030405": { name: "Keylor Navas Gamboa", birthDate: "1986-12-15", gender: "Masculino" },
    "501230456": { name: "Franklin Chang Diaz", birthDate: "1950-04-05", gender: "Masculino" },
    "123456789": { name: "Luis Rojas", birthDate: "1985-05-18", gender: "Masculino" },
    "111111111": { name: "Juan Perez", birthDate: "1990-01-01", gender: "Masculino" },
    "222222222": { name: "Maria Soto", birthDate: "1988-06-15", gender: "Femenino" },
    "333333333": { name: "Carlos Ruiz", birthDate: "1993-11-20", gender: "Masculino" }
};


const MALE_NAMES = ["Juan", "Carlos", "Luis", "José", "Jorge", "Andrés", "Alejandro", "Mario", "Pedro", "Manuel", "Francisco", "David", "Roberto", "Daniel", "Oscar", "Franklin"];
const FEMALE_NAMES = ["María", "Laura", "Ana", "Lucía", "Elena", "Sonia", "Beatriz", "Gabriela", "Carmen", "Rosa", "Marta", "Silvia", "Patricia", "Lorena", "Andrea", "Camila"];
const SURNAMES = ["Rodríguez", "Vargas", "Jiménez", "Mora", "Rojas", "González", "Sánchez", "Araya", "Castro", "Herrera", "Valverde", "Guzmán", "Salazar", "Solano", "Chaves", "Quesada", "Miranda", "Alvarado", "Chinchilla", "Solis", "Navas", "Chang", "Diaz", "Ruiz", "Soto"];

export const lookupCivilRegistry = (dni) => {
    return new Promise((resolve, reject) => {
        // Clean DNI format
        const cleanDni = dni.replace(/\D/g, "");
        
        if (cleanDni.length !== 9) {
            return reject(new Error("La cédula costarricense debe tener exactamente 9 dígitos."));
        }

        const province = parseInt(cleanDni[0]);
        if (province < 1 || province > 9) {
            return reject(new Error("El primer dígito de la cédula (provincia) debe estar entre 1 y 9."));
        }

        setTimeout(() => {
            // Check mock citizens first
            if (MOCK_CITIZENS[cleanDni]) {
                const mock = MOCK_CITIZENS[cleanDni];
                const parts = mock.name.split(' ');
                let firstName = parts[0] || '';
                let secondName = '';
                let firstLastName = '';
                let secondLastName = '';
                if (parts.length === 3) {
                    firstLastName = parts[1] || '';
                    secondLastName = parts[2] || '';
                } else if (parts.length >= 4) {
                    secondName = parts[1] || '';
                    firstLastName = parts[2] || '';
                    secondLastName = parts.slice(3).join(' ') || '';
                } else if (parts.length === 2) {
                    firstLastName = parts[1] || '';
                }

                return resolve({ 
                    document: formatDni(cleanDni), 
                    ...mock,
                    firstName,
                    secondName,
                    firstLastName,
                    secondLastName
                });
            }

            // Deterministic generation
            const seed = parseInt(cleanDni);
            const isFemale = seed % 2 !== 0; // odd DNI -> Female, even -> Male
            const gender = isFemale ? "Femenino" : "Masculino";
            
            const nameList = isFemale ? FEMALE_NAMES : MALE_NAMES;
            const firstNameIdx = (seed + 123) % nameList.length;
            const secondNameIdx = (seed + 234) % nameList.length;
            const firstSurnameIdx = (seed + 456) % SURNAMES.length;
            const secondSurnameIdx = (seed + 789) % SURNAMES.length;

            const firstName = nameList[firstNameIdx];
            // Include second name if seed is divisible by 2 or 3
            const hasSecondName = (seed % 2 === 0) || (seed % 3 === 0);
            const secondName = (hasSecondName && nameList[secondNameIdx] !== firstName) ? nameList[secondNameIdx] : '';
            const firstLastName = SURNAMES[firstSurnameIdx];
            const secondLastName = SURNAMES[secondSurnameIdx];
            const name = secondName 
                ? `${firstName} ${secondName} ${firstLastName} ${secondLastName}`
                : `${firstName} ${firstLastName} ${secondLastName}`;

            // Deterministic Birth Date between 1950 and 2005
            const birthYear = 1950 + (seed % 56);
            const birthMonth = 1 + ((seed + 10) % 12);
            const birthDay = 1 + ((seed + 20) % 28);
            
            const pad = (n) => n.toString().padStart(2, '0');
            const birthDate = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

            resolve({
                document: formatDni(cleanDni),
                name,
                firstName,
                secondName,
                firstLastName,
                secondLastName,
                birthDate,
                gender
            });
        }, 600); // 600ms loading simulation
    });
};

const formatDni = (digits) => {
    return `${digits[0]}-${digits.substring(1, 5)}-${digits.substring(5)}`;
};
