'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Portfolio extends Model {
    static associate(models) {
      // define association here
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
    image: DataTypes.STRING,
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Genel'
    },
    technologies: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('technologies');
        return rawValue ? rawValue.split(',') : [];
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('technologies', val.join(','));
        } else {
          this.setDataValue('technologies', val);
        }
      }
    },
    projectUrl: {
      type: DataTypes.STRING,
      field: 'project_url'
    },
    githubUrl: {
      type: DataTypes.STRING,
      field: 'github_url'
    }
  }, {
    sequelize,
    modelName: 'Portfolio',
    underscored: true,
    timestamps: true
  });
  return Portfolio;
}; 