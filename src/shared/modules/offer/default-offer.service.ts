import { inject, injectable } from 'inversify';
import { OfferService } from './offer-service.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { OfferEntity } from './offer.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import {UpdateOfferDto} from './dto/update-offer.dto.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>
  ) {}

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const result = await this.offerModel.create(dto);
    result.setCoordinates();
    this.logger.info(`New offer created: ${dto.title}`);

    return result;
  }

  public async findById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findById(offerId)
      .exec();
  }

  public async updateById(offerId: string, dto: UpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, dto, {new: true})
      .exec();
  }

  public async deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndDelete(offerId)
      .exec();
  }

  public async find(limit = 60): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find()
      .sort({postDate: -1})
      .limit(limit)
      .exec();
  }

  public async findPremiumByCity(city: string): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find({cityName: city, isPremium: true})
      .sort({postDate: -1})
      .limit(3)
      .exec();
  }

  public async exists(offerId: string): Promise<boolean> {
    return (await this.offerModel.exists({_id: offerId})) !== null;
  }

  public async incCommentCount(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, {$inc: {commentsCount: 1}})
      .exec();
  }

  public async findFavorites(userId: string): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find({ isFavorite: true, userId })
      .exec();
  }

  public async toggleFavorite(userId: string, offerId: string): Promise<DocumentType<OfferEntity> | null> {
    const offer = await this.offerModel.findOne({ _id: offerId, userId });
    if (!offer) {
      return null;
    }
    offer.isFavorite = !offer.isFavorite;
    return offer.save();
  }
}
