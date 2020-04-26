import {DataTypes} from 'sequelize'
import {AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table, Unique} from 'sequelize-typescript'
import UserModel from '@/models/UserModel'

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

  @ForeignKey(() => UserModel)
  @Column(DataTypes.STRING)
  public userId!: string

  // 关系
  @BelongsTo(() => UserModel, 'userId')
  public readonly user?: UserModel
}

export default TokenModel
