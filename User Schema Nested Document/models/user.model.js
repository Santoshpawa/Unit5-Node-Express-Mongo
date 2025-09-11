const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  profile: [
    {
      profileName: {
        enum: ["fb", "twitter", "github", "instagram"],
        required: true,
      },
      url: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(v);
          },
          message: (props) => `${props.value} is not a valid URL`,
        },
      },
    },
  ],
});

const UserModel = mongoose.model("vehicle", userSchema);

module.exports = UserModel;
