import {DataTypes} from 'sequelize'
import {AllowNull, Column, Model, PrimaryKey, Table, Unique} from 'sequelize-typescript'

@Table({tableName: 'tokens'})
class TokenModel extends Model<TokenModel> {
  // 字段
  @Unique
  @AllowNull(false)
  @PrimaryKey
  @Column(DataTypes.STRING)
  public refreshToken!: string

  @AllowNull(false)
  @Column(DataTypes.DATE)
  public expireAt!: Date

  @Column(DataTypes.STRING)
  public userId!: string
}

export default TokenModel
