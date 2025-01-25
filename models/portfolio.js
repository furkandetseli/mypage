'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Portfolio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // İlişkiler burada tanımlanacak (gerekirse)
    }
  }
  Portfolio.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    technologies: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('technologies');
        return rawValue ? rawValue.split(',') : [];
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('technologies', value.join(','));
        } else {
          this.setDataValue('technologies', value);
        }
      }
    },
    projectUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    githubUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Genel'
    }
  }, {
    sequelize,
    modelName: 'Portfolio',
    tableName: 'portfolios',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Portfolio;
}; 