import { profileItem } from "../db/schema/profileItem";
import { I_PROFILE } from "../types/interfaces";
import { transporter } from "../utils/smtp";
import con from "../db/dbConfig";
const Identicon = require("identicon.js");

const executeQuery = (con: any, query: string, values: any[]) => {
  return new Promise((resolve, reject) => {
    con.query(query, values, (error: any, results: any, fields: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

export const updateProfile = async (_address: string, payload: I_PROFILE) => {
  const query =
    "UPDATE profileitem SET name = ?, bio = ?, email = ?, website = ?, twitter = ?, instagram = ?, coverImage = ?, avatarImage = ?, isVerifeid = ? WHERE address = ?";
  const values = [
    payload.name,
    payload.bio,
    payload.email,
    payload.website,
    payload.twitter,
    payload.instagram,
    payload.coverImage,
    payload.avatarImage,
    payload.isVerifeid,
    _address,
  ];
  const [rows] = await con.promise().execute(query, values);

  if (rows.affectedRows > 0) {
    return payload;
  } else {
    // Profile not found, handle accordingly
    return null;
  }
};

export const fetchProfile = async (_address: string) => {
  return new Promise((resolve, reject) => {
    try {
      const query = "SELECT * FROM profileitem WHERE address = ?";
      con.query(query, [_address], (error: any, results: any, fields: any) => {
        if (error) {
          console.error("Error:", error);
          reject(error);
        } else {
          if (results.length > 0) {
            resolve(results[0]);
          } else {
            const newProfile = {
              address: _address,
              name: _address.slice(-5),
              avatarImage: `data:image/svg+xml;base64,${new Identicon(
                _address,
                {
                  size: 420, // 420px square
                  format: "svg", // use SVG instead of PNG
                }
              ).toString()}`,
              // Set other default values
            };
            con.query(
              "INSERT INTO profileitem (address, name, avatarImage) VALUES (?,?,?)",
              [newProfile.address, newProfile.name, newProfile.avatarImage],
              (error: any, results: any, fields: any) => {
                if (error) {
                  console.error("Error:", error);
                  reject(error);
                } else {
                  return newProfile;
                }
              }
            );
          }
        }
      });
    } catch (error) {
      console.error("Error:", error);
      reject(error);
    }
  });
};

export const fetchTopNFTHolders = async () => {
  const query =
    "SELECT p.name AS name, n.owner AS owner, p.avatarImage as Image, COUNT(n.id) AS count, SUM(n.latest_trade_price) AS total_price FROM ProfileItem p INNER  JOIN NftItem n ON p.address = n.owner GROUP BY p.address ORDER BY total_price DESC LIMIT 10";
  const results: any = await executeQuery(con, query, []);
  if (results.length === 0) return;
  return results;
};
export const fetchUser = async (_name: string) => {
  const query = "SELECT * FROM profileitem WHERE name = ?";
  const [rows] = await con.promise().execute(query, [_name]);

  return rows.length > 0;
};

export const allUsers = async () => {
  const query = "SELECT * FROM ProfileItem";
  const [rows] = await con.promise().execute(query);

  return rows;
};

export const sendVerification = async (email: string, address: string) => {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  const updateQuery = "UPDATE profileitem SET code = ? WHERE address = ?";
  const updateValues = [randomNumber, address];
  await con.promise().execute(updateQuery, updateValues);

  // Send your email using your chosen email library
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email for Vexpy",
    text: `Hello. Your verification code is: ${randomNumber}. Thanks, Vexpy team.`,
    html: `<div>
            <div>Hello.</div>
            <br />
            <div>Your verification code is :</div>
            <div>${randomNumber}</div>
            <div>Vexpy team.</div>
          </div>`,
  };

  // Send the email using your email library
  let info = await transporter.sendMail(mailOptions);
  return { value: "ok" };
};
